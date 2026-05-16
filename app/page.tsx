"use client";

import { toast } from "sonner";
import { useState } from "react";
import CTA from "@/components/cta";
import Form from "@/components/form";
import HowItWorks from "@/components/how-it-works";
import Particles from "@/components/ui/particles";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function Home() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!name || !email) {
      toast.error("모든 항목을 입력해 주세요 🙂");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("올바른 이메일 주소를 입력해 주세요 🙂");
      return;
    }

    setLoading(true);

    const promise = new Promise(async (resolve, reject) => {
      try {
        // First, attempt to send the email
        const mailResponse = await fetch("/api/mail", {
          cache: "no-store",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ firstname: name, email }),
        });

        if (!mailResponse.ok) {
          if (mailResponse.status === 429) {
            reject("Rate limited");
          } else {
            reject("Email sending failed");
          }
          return; // Exit the promise early if mail sending fails
        }

        // If email sending is successful, proceed to insert into Notion
        const notionResponse = await fetch("/api/notion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email }),
        });

        if (!notionResponse.ok) {
          if (notionResponse.status === 429) {
            reject("Rate limited");
          } else {
            reject("Notion insertion failed");
          }
        } else {
          resolve({ name });
        }
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: "웨이트리스트에 등록하는 중... 🚀",
      success: (data) => {
        setName("");
        setEmail("");
        return "Mosmos 웨이트리스트 합류 완료! 곧 만나요 🎉";
      },
      error: (error) => {
        if (error === "Rate limited") {
          return "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.";
        } else if (error === "Email sending failed") {
          return "메일 발송에 실패했어요. 다시 시도해 주세요 😢";
        } else if (error === "Notion insertion failed") {
          return "정보 저장에 실패했어요. 다시 시도해 주세요 😢";
        }
        return "문제가 발생했어요. 다시 시도해 주세요 😢";
      },
    });

    promise.finally(() => {
      setLoading(false);
    });
  };

  return (
    <main className="mos-aurora flex min-h-screen flex-col items-center overflow-x-clip pt-12 md:pt-24">
      <section className="flex flex-col items-center px-4 sm:px-6 lg:px-8">
        <Header />

        <CTA />

        <Form
          name={name}
          email={email}
          handleNameChange={handleNameChange}
          handleEmailChange={handleEmailChange}
          handleSubmit={handleSubmit}
          loading={loading}
        />

        <HowItWorks />
      </section>

      <Footer />

      <Particles
        quantityDesktop={350}
        quantityMobile={100}
        ease={80}
        color={"#AC9DC6"}
        refresh
      />
    </main>
  );
}
