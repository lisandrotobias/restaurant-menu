<script>
  import { onMount } from 'svelte';
  export let data;
  const { restaurant, menu } = data;
  
  // Ordenar categorías por el campo 'order'
  $: sortedCategories = [...menu.categories].sort((a, b) => a.order - b.order);
  $: activeCategory = sortedCategories[0]?.id;

  // Get menu items with category info - adapted for new API format
  $: menuItems = menu.items.map(item => ({
    ...item,
    category: menu.categories.find(c => c.id === item.category_id)?.display_name,
    additionals: item.additional_ids
      .map(id => menu.additionals.find(a => a.id === id))
      .filter(Boolean)
  }));

  function scrollToCategory(categoryId) {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const headerOffset = 180;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      activeCategory = categoryId;
    }
  }

  // Set up intersection observer
  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const categoryId = parseInt(entry.target.id.split('-')[1]);
          activeCategory = categoryId;
        }
      });
    }, {
      rootMargin: '-120px 0px -50% 0px', // Adjust these values to fine-tune when categories become active
      threshold: 0
    });

    // Observe all category sections
    sortedCategories.forEach(category => {
      const element = document.getElementById(`category-${category.id}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  });

  // WhatsApp link only if phone number exists
  $: whatsappLink = restaurant.phone_number 
    ? `https://wa.me/${restaurant.phone_number}?text=${encodeURIComponent("¡Hola! Me gustaría hacer un pedido 🍝")}`
    : null;
</script>

<div class="container mx-auto px-4 pb-20 font-primary" style="--accent-color: #D00000;">
  <!-- Logo section -->
  <div class="pt-6 pb-2 text-center flex flex-col items-center">
    <img src={restaurant.logo_url} alt={restaurant.name} class="h-44" />
    
    {#if whatsappLink}
      <a href={whatsappLink}
         target="_blank"
         rel="noopener noreferrer"
         class="mt-4 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white px-6 py-2.5 rounded-full
                transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span class="font-medium">Pedí por WhatsApp</span>
      </a>
    {/if}
  </div>

  <!-- Categorías mejoradas -->
  <div class="overflow-x-auto flex gap-6 py-6 px-2 no-scrollbar sticky top-0 bg-white/95 backdrop-blur-sm shadow-sm z-10">
    {#each sortedCategories as category}
      <button 
        on:click={() => scrollToCategory(category.id)}
        class="flex flex-col items-center min-w-[5rem] max-w-[5.5rem] transition-all duration-200 hover:scale-105"
      >
        <div class="relative">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-accent/20 to-accent flex items-center justify-center text-2xl
                      shadow-md border-2 border-white
                      {activeCategory === category.id ? 'ring-2 ring-accent ring-offset-2' : ''}">
            {category.icon}
          </div>
          {#if activeCategory === category.id}
            <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-accent"></div>
          {/if}
        </div>
        <span class="text-xs mt-2 text-center font-medium leading-tight line-clamp-2
                     {activeCategory === category.id ? 'text-accent' : 'text-gray-700'}">
          {category.display_name}
        </span>
      </button>
    {/each}
  </div>

  <!-- Separador decorativo -->
  <div class="w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent mt-6 mb-2"></div>

  <!-- Lista de categorías y productos -->
  {#each sortedCategories as category}
    <div id="category-{category.id}" class="mb-8">
      <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
        <span class="text-accent">{category.icon}</span>
        <span>{category.display_name}</span>
      </h2>
      
      <div class="grid gap-4">
        {#each menuItems.filter(item => item.category_id === category.id) as item}
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body p-4">
              <div class="flex gap-4">
                <div class="flex-1">
                  <h3 class="font-primary text-lg font-semibold">{item.name}</h3>
                  {#if item.description}
                    <p class="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                  {/if}
                  {#if item.additionals.length > 0}
                    <div class="text-sm text-gray-600 mt-1">
                      <span class="font-medium">Opciones:</span>
                      {item.additionals.map(add => add.name).join(', ')}
                    </div>
                  {/if}
                  <div class="text-lg font-medium mt-2 text-accent">
                    ${item.price.toLocaleString()}
                  </div>
                </div>
                
                {#if item.image}
                  <div class="block w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <div class="w-full h-full relative">
                      <div class="absolute inset-0 bg-gray-200 animate-pulse"></div>
                      <img 
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        width="80"
                        height="80"
                        class="absolute w-full h-full object-cover"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}

  <!-- Footer -->
  <div class="mt-12 pb-4 text-center">
    <span class="text-xs text-gray-500">Made by</span>
    <br />
    <a 
      href="https://capybarasolutions.com" 
      target="_blank" 
      rel="noopener noreferrer" 
      class="font-['League_Spartan'] text-base font-bold text-black hover:text-accent transition-colors"
    >
      Capybara Solutions
    </a>
  </div>
</div>

<style>
  /* Ocultar scrollbar pero mantener funcionalidad */
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
</style> 