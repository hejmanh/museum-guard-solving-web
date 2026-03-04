import Image from "next/image";

export default function IntroductionSection() {
  return (
    <>
      <section className="mb-2 sm:mb-4">
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
          The Museum Guard Problem seeks to determine the minimum number of guards needed to monitor all rooms in a museum. 
          This tool solves the problem using different algorithms: <strong>Greedy</strong>, <strong>Genetic</strong>, and <strong>PSO</strong> (Particle Swarm Optimization).
        </p>
      </section>

      {/* Example Image - Hidden on mobile portrait for space */}
      <section className="mb-2 sm:mb-4 portrait:hidden landscape:flex justify-center">
        <div className="overflow-hidden">
          <Image
            src="/images/example.png"
            alt="Museum guard problem example"
            width={200} 
            height={120} 
          />
        </div>
      </section>
    </>
  );
}
