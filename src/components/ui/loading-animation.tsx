import { useEffect, useRef } from 'react';

export const KineticTypographyLoader = () => {
    const loaderTextRef = useRef<HTMLHeadingElement>(null);
    const words = ["The Portable", "Crifolayer", "For The Web."];
    let currentWordIndex = 0;

    useEffect(() => {
        const loaderText = loaderTextRef.current;
        if (!loaderText) return;

        let animationTimeout: NodeJS.Timeout;
        let wordCycleTimeout: NodeJS.Timeout;

        function animateWord() {
            const word = words[currentWordIndex];
            loaderText!.innerHTML = ''; // Clear previous word

            // If the word contains spaces, we want to prevent wrapping issues while keeping chars inline-block
            const chars = word.split('').map((char, index) => {
                const span = document.createElement('span');
                span.className = 'char';
                
                if (char === ' ') {
                    // Use a non-breaking space with a style
                    span.innerHTML = '&nbsp;';
                } else {
                    span.textContent = char;
                }
                
                // Color the word "Crifolayer" with the beautiful orange gradient
                if (word === "Crifolayer") {
                    span.style.background = 'linear-gradient(135deg, #ffffff 0%, #f97316 60%, #ffedd5 100%)';
                    span.style.webkitBackgroundClip = 'text';
                    span.style.webkitTextFillColor = 'transparent';
                    span.style.backgroundClip = 'text';
                    span.style.fontWeight = '800';
                }
                
                const fromX = (Math.random() - 0.5) * 800;
                const fromY = (Math.random() - 0.5) * 800;
                const fromZ = (Math.random() - 0.5) * 800;
                const fromRotX = (Math.random() - 0.5) * 360;
                const fromRotY = (Math.random() - 0.5) * 360;
                span.style.setProperty('--transform-from', `translate3d(${fromX}px, ${fromY}px, ${fromZ}px) rotateX(${fromRotX}deg) rotateY(${fromRotY}deg)`);
                
                span.style.animationName = 'fly-in';
                span.style.animationDelay = `${index * 0.04}s`;
                span.style.animationPlayState = 'running';
                
                loaderText!.appendChild(span);
                return span;
            });

            // Snappy timings: fly-out starts after 1.2s, word cycles after 1.8s
            animationTimeout = setTimeout(() => {
                chars.forEach((span, index) => {
                    const toX = (Math.random() - 0.5) * 800;
                    const toY = (Math.random() - 0.5) * 800;
                    const toZ = (Math.random() - 0.5) * 800;
                    const toRotX = (Math.random() - 0.5) * 360;
                    const toRotY = (Math.random() - 0.5) * 360;
                    span.style.setProperty('--transform-to', `translate3d(${toX}px, ${toY}px, ${toZ}px) rotateX(${toRotX}deg) rotateY(${toRotY}deg)`);

                    span.style.animationName = 'fly-out';
                    span.style.animationDelay = `${(chars.length - index) * 0.04}s`;
                });
            }, 1200);

            wordCycleTimeout = setTimeout(() => {
                currentWordIndex = (currentWordIndex + 1) % words.length;
                animateWord();
            }, 1800);
        }

        animateWord();

        // Cleanup function to clear timeouts when the component unmounts
        return () => {
            clearTimeout(animationTimeout);
            clearTimeout(wordCycleTimeout);
        };
    }, []); // Empty dependency array ensures this runs only once

    return (
        <div className="loader-container bg-[#09090b] flex items-center justify-center min-h-screen w-full [perspective:1000px] overflow-hidden select-none">
            <h1 ref={loaderTextRef} className="text-4xl sm:text-6xl lg:text-7xl font-light text-white tracking-[-0.03em] whitespace-nowrap [transform-style:preserve-3d]">
            </h1>
        </div>
    );
};
