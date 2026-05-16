import Link from "next/link";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animation-variants";

export default function Footer() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mt-auto flex w-full flex-col items-center justify-center gap-1 border-t bg-background p-6 text-sm text-muted-foreground md:flex-row md:justify-between">
      <motion.div variants={itemVariants}>
        © 2026 Mosmos. 내 AI가 자라는 세계.
      </motion.div>
      <motion.div variants={itemVariants}>
        <Link
          href="https://mosmos.world"
          rel="noopener noreferrer"
          target="_blank">
          <span className="text-zinc-300 underline underline-offset-2 transition-all duration-200 ease-linear hover:text-mos-lilac">
            mosmos.world
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}
