document.addEventListener("DOMContentLoaded", () => {

    const slides = document.getElementById("slides");
    const slideItems = document.querySelectorAll(".slide");
    const indicatorsContainer = document.getElementById("indicators");

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    let index = 0;
    const total = slideItems.length;
    let autoSlide;

    if (!slides || !prevBtn || !nextBtn || !indicatorsContainer) {
        console.error("Slider element tidak ditemukan");
        return;
    }

    slideItems.forEach((_, i) => {
        const indicator = document.createElement("div");
        indicator.className = "indicator";
        if (i === 0) indicator.classList.add("active");

        indicator.addEventListener("click", () => {
            index = i;
            showSlide();
            resetAutoSlide();
        });

        indicatorsContainer.appendChild(indicator);
    });

    const indicators = document.querySelectorAll(".indicator");

    function showSlide() {
        slides.style.transform = `translateX(${-index * 100}%)`;

        indicators.forEach(ind => ind.classList.remove("active"));
        indicators[index].classList.add("active");
    }

    prevBtn.addEventListener("click", () => {
        index = (index - 1 + total) % total;
        showSlide();
        resetAutoSlide();
    });

    nextBtn.addEventListener("click", () => {
        index = (index + 1) % total;
        showSlide();
        resetAutoSlide();
    });

    function startAutoSlide() {
        autoSlide = setInterval(() => {
            index = (index + 1) % total;
            showSlide();
        }, 4000);
    }

    function resetAutoSlide() {
        clearInterval(autoSlide);
        startAutoSlide();
    }

    startAutoSlide();
});
