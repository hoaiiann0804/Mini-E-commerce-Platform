import React, { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
const logos = [
  "/logos/google.svg",
  "/logos/facebook.svg",
  "/logos/amazon.svg",
  "/logos/netflix.svg",
  "/logos/microsoft.svg",
  "/logos/apple.svg",
];
const BrandCarousel: React.FC = () => {
  const [emblaRef, emlaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    dragFree: true,
  });
  useEffect(() => {
    if (!emlaApi) return
  
    const engine = emlaApi.internalEngine()
    let rafId: number
    const speed = 0.002
  
    const autoScroll = () => {
      engine.location.add(speed)
      engine.target.set(engine.location)
      engine.scrollBody.seek()
      rafId = requestAnimationFrame(autoScroll)
    }
  
    autoScroll()
    return () => cancelAnimationFrame(rafId)
  }, [emlaApi])
  
  return (
    <div className="overflow-hidden w-full py-6" ref={emblaRef}>
    <div className="flex">
      {[...logos, ...logos, ...logos].map((logo, index) => (
        <div
          key={index}
          className="flex-[0_0_auto] w-64 px-10 flex justify-center"
        >
          <div className="h-10 w-32 bg-gray-300 rounded" />
        </div>
      ))}
    </div>
  </div>
  
  );
};

export default BrandCarousel;
