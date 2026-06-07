import { motion } from "framer-motion";
import TextBlur from "@/components/ui/text-blur";
import AnimatedShinyText from "@/components/ui/shimmer-text";
import { containerVariants, itemVariants } from "@/lib/animation-variants";

export default function CTA() {
  return (
    <motion.div
      className="flex w-full max-w-2xl flex-col gap-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible">
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-center">
          <div className="flex w-fit items-center justify-center rounded-full bg-muted/80 text-center">
            <AnimatedShinyText className="px-4 py-1">
              <span>비공개 베타 · Private Beta</span>
            </AnimatedShinyText>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="relative mx-auto">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 mx-auto h-32 w-32 rounded-full bg-mos-lilac/25 blur-3xl"
        />
        <motion.img
          src="/brand/symbol.png"
          alt="Mosmos"
          className="mx-auto h-28 w-28 animate-orbit-float drop-shadow-[0_8px_30px_rgba(172,157,198,0.35)]"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <TextBlur
          className="text-center text-3xl font-medium tracking-tighter text-mos-cloud sm:text-5xl"
          text="내 AI가 자라는 세계"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <TextBlur
          className="mx-auto max-w-[34rem] pt-1.5 text-center text-base text-zinc-300 sm:text-lg"
          text="말만 하세요. 움직이는 건 Mos. 목표만 말하면 내 AI 화신 Mos가 필요한 Mon을 불러 일을 끝냅니다."
          duration={0.8}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <p className="pt-1 text-center text-sm tracking-wide text-mos-lilac">
          A world where my AI grows up.
        </p>
      </motion.div>
    </motion.div>
  );
}
