"use client";

import { Title } from "@mantine/core";
import { FileUp, SlidersHorizontal, Printer } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { homeSteps } from "@/config/home";
import { Routes } from "@/config/routes";
import { Card } from "./card";
import { InfoHero } from "./hero";
import { InfoQuestions } from "./questions";
import { InfoSupport } from "./support";

const stepIcons = [FileUp, SlidersHorizontal, Printer];

const Info = () => (
  <PageContainer>
    <PageHeader title="Помощь" backUrl={Routes.Home} />
    <InfoHero />
    <InfoQuestions />
    <section className="mt-10 md:mt-12" aria-labelledby="guide-title">
      <Title id="guide-title" order={2}>
        Как оформить заказ
      </Title>
      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        {homeSteps.map(({ title, text }, index) => (
          <li key={title}>
            <Card
              icon={stepIcons[index]}
              title={title}
              text={text}
              number={index + 1}
            />
          </li>
        ))}
      </ol>
    </section>
    <InfoSupport />
  </PageContainer>
);

export default Info;
