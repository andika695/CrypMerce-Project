document.addEventListener('DOMContentLoaded', () => {
    const categories = [
        { id: 'fashion-pria', name: 'Fashion Pria', icon: 'fa-tshirt' },
        { id: 'fashion-wanita', name: 'Fashion Wanita', icon: 'fa-female' },
        { id: 'handphone', name: 'Handphone', icon: 'fa-mobile-alt' },
        { id: 'kecantikan', name: 'Kecantikan', icon: 'fa-spray-can' },
        { id: 'kesehatan', name: 'Kesehatan', icon: 'fa-heartbeat' },
        { id: 'komputer', name: 'Komputer', icon: 'fa-desktop' },
        { id: 'otomotif', name: 'Otomotif', icon: 'fa-car' },
        { id: 'makanan', name: 'Makanan', icon: 'fa-utensils' }
    ];

    const track = document.getElementById('categoryTrack');
    const prevBtn = document.getElementById('catPrevBtn');
    const nextBtn = document.getElementById('catNextBtn');
    
    // Render Categories
    categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.dataset.value = cat.id;
        card.innerHTML = `
            <i class="fas ${cat.icon} category-icon"></i>
            <span class="category-name">${cat.name}</span>
        `;
        
        card.addEventListener('click', () => {
            // Remove active class from all
            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
            // Add active to clicked
            card.classList.add('active');
            
            // Load products
            if (window.filterProductsByCategory) {
                window.filterProductsByCategory(cat.id);
            } else if (window.loadProducts) {
                window.loadProducts(cat.id);
            }
        });
        
        track.appendChild(card);
    });

    // Carousel Logic
    let currentIndex = 0;
    const totalItems = categories.length;
    
    function updateCarousel() {
        // Calculate items per view based on screen width (matching CSS)
        let itemsPerView = 6;
        if (window.innerWidth <= 576) itemsPerView = 2;
        else if (window.innerWidth <= 768) itemsPerView = 3;
        else if (window.innerWidth <= 992) itemsPerView = 4;
        else if (window.innerWidth <= 1200) itemsPerView = 5;

        // Gap is 20px
        const itemWidthPercent = 100 / itemsPerView; 
        const translateX = -(currentIndex * (itemWidthPercent)); 
        
        // Note: The simple percentage calculation above assumes the gap is handled strictly by flex-gap.
        // In our CSS we used calc((100% - gap)/N).
        // To slide correctly by 1 item, we need to slide by (100% + gap) / itemsPerView? No.
        // The track width is dynamic.
        // Let's rely on the card width.
        
        const card = document.querySelector('.category-card');
        if (card) {
            const cardWidth = card.offsetWidth;
            const gap = 20; // from CSS
            const moveAmount = (cardWidth + gap) * currentIndex;
            track.style.transform = `translateX(-${moveAmount}px)`;
        }
        
        // Update button states
        prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        prevBtn.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
        
        const maxIndex = totalItems - itemsPerView;
        nextBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
        nextBtn.style.pointerEvents = currentIndex >= maxIndex ? 'none' : 'auto';
    }

    nextBtn.addEventListener('click', () => {
        // Recalculate maxIndex on click in case of resize
        let itemsPerView = 6;
        if (window.innerWidth <= 576) itemsPerView = 2;
        else if (window.innerWidth <= 768) itemsPerView = 3;
        else if (window.innerWidth <= 992) itemsPerView = 4;
        else if (window.innerWidth <= 1200) itemsPerView = 5;
        
        if (currentIndex < totalItems - itemsPerView) {
            currentIndex++;
            updateCarousel();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });

    // Handle Resize
    window.addEventListener('resize', updateCarousel);
    
    // Initial call
    setTimeout(updateCarousel, 100); // Small delay to ensure rendering
});
