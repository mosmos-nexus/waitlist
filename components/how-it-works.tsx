import { motion } from "framer-motion";
import { Sparkles, Users, ScrollText, Gem } from "lucide-react";
import { containerVariants, itemVariants } from "@/lib/animation-variants";
import TextBlur from "./ui/text-blur";

const pillars = [
  {
    name: "Mos",
    plain: "내 AI 화신",
    desc: "목표를 듣고, 계획하고, 결과를 하나로 정리해주는 나만의 AI 존재.",
    Icon: Sparkles,
    color: "text-mos-lilac",
    ring: "group-hover:border-mos-lilac/50",
    glow: "bg-mos-lilac/10",
  },
  {
    name: "Mon",
    plain: "일을 맡는 전문가",
    desc: "조사·글쓰기·디자인처럼 특정 일을 실제로 수행하는 실행 전문가.",
    Icon: Users,
    color: "text-mos-coral",
    ring: "group-hover:border-mos-coral/50",
    glow: "bg-mos-coral/10",
  },
  {
    name: "Skill",
    plain: "일하는 레시피",
    desc: "Mon이 같은 일을 더 안정적으로 해내도록 돕는 절차·규칙 묶음.",
    Icon: ScrollText,
    color: "text-mos-gold",
    ring: "group-hover:border-mos-gold/50",
    glow: "bg-mos-gold/10",
  },
  {
    name: "Mana",
    plain: "세계의 크레딧",
    desc: "실행하고, Mon을 빌리고, Skill을 사고팔 때 순환하는 가치 단위.",
    Icon: Gem,
    color: "text-mos-iris",
    ring: "group-hover:border-mos-iris/50",
    glow: "bg-mos-iris/10",
  },
];

export default function HowItWorks() {
  return (
    <motion.div
      className="flex h-full w-full flex-col gap-2 pb-12 pt-12 md:pb-24 md:pt-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible">
      <motion.div variants={itemVariants}>
        <TextBlur
          className="text-center text-2xl font-medium tracking-tight text-mos-cloud md:text-3xl"
          text="Mosmos는 이렇게 움직입니다"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <TextBlur
          className="text-center text-base text-zinc-300 sm:text-lg"
          text="어려운 AI 용어 대신, 쉬운 제품 언어로. 목표만 말하면 됩니다."
          duration={0.8}
        />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="mt-4 grid w-full grid-cols-2 items-stretch justify-center gap-4 md:mt-6 md:grid-cols-4 md:gap-6">
        {pillars.map((p) => (
          <div
            key={p.name}
            className={`group relative flex flex-col gap-2 overflow-hidden rounded-xl border bg-zinc-900/60 p-5 transition-all duration-200 ease-in-out md:hover:bg-accent ${p.ring}`}>
            <div
              aria-hidden
              className={`absolute -right-6 -top-6 h-16 w-16 rounded-full blur-2xl ${p.glow}`}
            />
            <p.Icon className={`h-6 w-6 ${p.color}`} />
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-semibold text-mos-cloud">{p.name}</h3>
              <span className="text-xs text-muted-foreground">{p.plain}</span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">{p.desc}</p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
