import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface EmailProps {
  userFirstname: string;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mosmos.world";

export const MosmosWaitlistEmail = ({ userFirstname }: EmailProps) => (
  <Html>
    <Head />
    <Preview>
      {userFirstname}님, Mosmos 웨이트리스트에 오신 걸 환영합니다 🎉
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/brand/signature-horizontal.png`}
          width="220"
          height="54"
          alt="Mosmos"
          style={logo}
        />
        <Text style={greeting}>{userFirstname}님, 반가워요 👋</Text>
        <Text style={paragraph}>
          <strong style={brand}>Mosmos</strong> 비공개 베타 웨이트리스트에
          합류해 주셔서 고맙습니다. Mosmos는 복잡한 AI·도구를 직접 고르지 않아도,
          내 AI 화신 <strong style={brand}>Mos</strong>에게 목표만 말하면 필요한{" "}
          <strong style={brand}>Mon</strong>을 불러 일을 끝내주는 세계입니다.
        </Text>
        <Text style={paragraph}>
          준비가 되는 대로 가장 먼저 초대장을 보내드릴게요. 그때까지 진행 상황과
          새로운 소식을 이메일로 전해드립니다. 궁금한 점이나 의견이 있다면 이
          메일에{" "}
          <a href="mailto:hello@mosmos.world" style={link}>
            그대로 답장
          </a>
          해 주세요 — 직접 읽고 답변드립니다.
        </Text>
        <Text style={paragraph}>
          더 알아보고 싶다면{" "}
          <a href="https://mosmos.world" style={link}>
            mosmos.world
          </a>
          를 둘러보세요.
        </Text>
        <Text style={signOff}>
          말만 하세요. 움직이는 건 Mos.
          <br />— Mosmos 팀 드림
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          이 메일은 Mosmos 웨이트리스트에 신청하셨기 때문에 발송되었습니다. 신청한
          적이 없다면 이 메일을 무시하셔도 됩니다.
        </Text>
      </Container>
    </Body>
  </Html>
);

MosmosWaitlistEmail.PreviewProps = {
  userFirstname: "지호",
} as EmailProps;

export default MosmosWaitlistEmail;

const main = {
  backgroundColor: "#0E1518",
  fontFamily:
    'figtree, -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif',
  padding: "40px 0",
  color: "#F9FAFD",
};

const container = {
  margin: "0 auto",
  padding: "28px 32px 44px",
  backgroundColor: "#121C20",
  borderRadius: "16px",
  border: "1px solid #243036",
  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.35)",
  maxWidth: "600px",
};

const logo = {
  margin: "0 auto 12px",
};

const brand = {
  color: "#AC9DC6",
};

const greeting = {
  fontSize: "18px",
  lineHeight: "28px",
  color: "#F9FAFD",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  marginBottom: "18px",
  color: "#C8CFD4",
};

const link = {
  color: "#AC9DC6",
  textDecoration: "underline",
};

const signOff = {
  fontSize: "16px",
  lineHeight: "26px",
  marginTop: "22px",
  color: "#F9FAFD",
};

const hr = {
  borderColor: "#243036",
  margin: "22px 0",
};

const footer = {
  color: "#7E888E",
  fontSize: "12px",
};
