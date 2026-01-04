document.addEventListener("DOMContentLoaded", () => {
    const slidesContainer = document.querySelector(".slides");
    const slides = document.querySelectorAll(".slide");
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");
    const indicatorsContainer = document.querySelector(".indicators");

    let currentIndex = 0;
    const totalSlides = slides.length;

    // Create indicators
    slides.forEach((_, index) => {
        const dot = document.createElement("div");
        dot.classList.add("indicator");
        if (index === 0) dot.classList.add("active");
        
        dot.addEventListener("click", () => {
            goToSlide(index);
            resetInterval();
        });
        
        indicatorsContainer.appendChild(dot);
    });

    const indicators = document.querySelectorAll(".indicator");

    function updateSlides() {
        // Remove active class from all
        slides.forEach(slide => slide.classList.remove("active"));
        indicators.forEach(ind => ind.classList.remove("active"));

        // Add active class to current
        if (slides[currentIndex]) {
            slides[currentIndex].classList.add("active");
        }
        if (indicators[currentIndex]) {
            indicators[currentIndex].classList.add("active");
        }

        // Calculate transform to center the active slide
        // We want the active slide to be in the center.
        // Formula: - (currentIndex * 80%) + (10% offset to center it since width is 80%, remaining 20% split by 2 = 10%)
        const offset = -(currentIndex * 80) + 10;
        slidesContainer.style.transform = `translateX(${offset}%)`;
    }

    function goToSlide(index) {
        if (index < 0) {
            currentIndex = totalSlides - 1;
        } else if (index >= totalSlides) {
            currentIndex = 0;
        } else {
            currentIndex = index;
        }
        updateSlides();
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    nextBtn.addEventListener("click", () => {
        nextSlide();
        resetInterval();
    });

    prevBtn.addEventListener("click", () => {
        prevSlide();
        resetInterval();
    });

    // Auto slide
    let slideInterval = setInterval(nextSlide, 5000);

    function resetInterval() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    }

    // Initial load
    updateSlides();
});
