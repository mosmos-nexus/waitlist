import Link from "next/link";
import { ChangeEvent } from "react";
import { motion } from "framer-motion";
import { FaArrowRightLong, FaRegEnvelope } from "react-icons/fa6";
import { Input } from "@/components/ui/input";
import { EnhancedButton } from "@/components/ui/enhanced-btn";
import { containerVariants, itemVariants } from "@/lib/animation-variants";

interface FormProps {
  name: string;
  email: string;
  handleNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  loading: boolean;
}

export default function Form({
  name,
  email,
  handleNameChange,
  handleEmailChange,
  handleSubmit,
  loading,
}: FormProps) {
  return (
    <motion.div
      className="mt-6 flex w-full max-w-[24rem] flex-col gap-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible">
      <motion.div variants={itemVariants}>
        <Input
          type="text"
          placeholder="이름"
          value={name}
          onChange={handleNameChange}
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <Input
          type="email"
          placeholder="이메일 주소"
          value={email}
          onChange={handleEmailChange}
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <EnhancedButton
          variant="expandIcon"
          Icon={FaArrowRightLong}
          onClick={handleSubmit}
          iconPlacement="right"
          className="mt-2 w-full"
          disabled={loading}>
          {loading ? "신청 중..." : "웨이트리스트 신청하기"}
        </EnhancedButton>
      </motion.div>
      <motion.div
        variants={itemVariants}
        className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground">
        <p>궁금한 점은</p>
        <Link
          href="mailto:hello@mosmos.world"
          className="inline-flex items-center gap-1 text-mos-lilac underline-offset-2 transition-all duration-200 ease-linear hover:text-mos-coral hover:underline">
          <FaRegEnvelope className="h-3.5 w-3.5" />
          hello@mosmos.world
        </Link>
      </motion.div>
    </motion.div>
  );
}
