import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";

import { containerVariants, itemVariants } from "@/lib/animation-variants";

export default function Header() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="fixed left-0 right-0 top-0 z-[50] m-4 flex items-center justify-between">
      <motion.div variants={itemVariants}>
        <Link
          href="https://mosmos.world"
          rel="noopener noreferrer"
          target="_blank"
          aria-label="Mosmos">
          <Image
            src="/brand/signature-horizontal.png"
            alt="Mosmos"
            width={520}
            height={129}
            priority
            className="h-7 w-auto opacity-95 transition-opacity duration-150 ease-linear hover:opacity-100 md:h-8"
          />
        </Link>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Link
          href="https://mosmos.world"
          rel="noopener noreferrer"
          target="_blank">
          <Button
            size="sm"
            variant="secondary"
            className="text-mos-cloud transition-all duration-150 ease-linear md:hover:text-mos-lilac">
            <FaArrowUpRightFromSquare className="md:mr-1.5" />
            <span className="hidden md:inline">mosmos.world</span>
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
