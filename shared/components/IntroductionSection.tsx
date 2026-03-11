import Image from "next/image";

export default function IntroductionSection() {
  return (
    <>
      <section className="mb-2 sm:mb-4">
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
          The Museum Guard Problem asks for the <strong>fewest guards</strong> needed to <strong>monitor every room</strong>. <br />
          Solve it here using <strong>Greedy</strong> or <strong>Genetic</strong> algorithms. Genetic mode supports <strong>room priorities</strong> and <strong>guard shifts</strong>.
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
