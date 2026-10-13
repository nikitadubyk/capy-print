"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, Text, UnstyledButton } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { Lightbox } from "@mantine/lightbox";
import { useReducedMotion } from "@mantine/hooks";
import { Expand, ImageOff } from "lucide-react";
import {
  lightboxLabels,
  workCategories,
  type WorkCategory,
  type WorkExample,
} from "@/config/services";

const WorkThumbnail = ({ work }: { work: WorkExample }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-capy-blue/40">
      {failed ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-capy-muted">
          <ImageOff size={28} aria-hidden="true" />
          <Text size="sm">Не удалось загрузить фото</Text>
        </div>
      ) : (
        <Image
          src={work.thumbnail}
          alt={work.alt}
          fill
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 300px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
      <span className="absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full bg-white/95 text-capy-ink shadow-sm">
        <Expand size={18} aria-hidden="true" />
      </span>
    </div>
  );
};

export const WorkGallery = ({
  works,
  withFilters = false,
}: {
  works: WorkExample[];
  withFilters?: boolean;
}) => {
  const [category, setCategory] = useState<WorkCategory>("all");
  const [opened, setOpened] = useState(false);
  const [index, setIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const visibleWorks = works.filter(
    (work) => category === "all" || work.category === category
  );

  return (
    <>
      {withFilters && (
        <div
          className="mb-5 flex flex-wrap gap-2"
          role="group"
          aria-label="Категории работ"
        >
          {workCategories.map(({ id, label }) => (
            <Button
              key={id}
              variant={category === id ? "filled" : "default"}
              size="sm"
              radius="xl"
              aria-pressed={category === id}
              onClick={() => {
                setCategory(id);
                setIndex(0);
                setCarouselIndex(0);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
      <Text size="sm" c="dimmed" className="mb-4">
        Листайте фотографии. Нажмите на работу, чтобы рассмотреть её поближе.
      </Text>
      <Carousel
        key={category}
        slideSize={{ base: "85%", sm: "50%", md: "33.333333%" }}
        slideGap="md"
        emblaOptions={{ align: "start", duration: reducedMotion ? 0 : 25 }}
        controlSize={44}
        controlsOffset="xs"
        previousControlProps={{ "aria-label": "Предыдущие работы" }}
        nextControlProps={{ "aria-label": "Следующие работы" }}
        aria-label="Карусель примеров работ"
        className="[&>[aria-live]]:hidden"
        onSlideChange={setCarouselIndex}
        classNames={{
          control:
            "border-capy-line bg-white text-capy-ink shadow-sm data-[inactive]:pointer-events-none data-[inactive]:opacity-0",
          controls: "top-[calc(50%-40px)]",
        }}
      >
        {visibleWorks.map((work, slideIndex) => (
          <Carousel.Slide
            key={work.id}
            aria-label={`Работа ${slideIndex + 1} из ${visibleWorks.length}`}
            aria-roledescription="слайд"
          >
            <UnstyledButton
              className="block w-full rounded-2xl text-left focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-capy-accent"
              aria-label={`Открыть: ${work.title}`}
              onClick={() => {
                setIndex(slideIndex);
                setOpened(true);
              }}
            >
              <WorkThumbnail work={work} />
              <Text fw={600} component="span" className="mt-4 block">
                {work.title}
              </Text>
              <Text
                size="sm"
                c="dimmed"
                component="span"
                className="mt-1 block"
              >
                {work.description}
              </Text>
            </UnstyledButton>
          </Carousel.Slide>
        ))}
      </Carousel>
      <Text className="sr-only" aria-live="polite" aria-atomic="true">
        В ленте: {visibleWorks[carouselIndex]?.title}
      </Text>
      <Lightbox
        opened={opened}
        onClose={() => setOpened(false)}
        currentIndex={index}
        onIndexChange={setIndex}
        slides={visibleWorks.map((work) => ({
          src: work.src,
          thumbSrc: work.thumbnail,
          alt: work.alt,
          caption: `${work.title}. ${work.description}`,
        }))}
        labels={lightboxLabels}
        withZoom
        withThumbnails
        transitionDuration={reducedMotion ? 0 : 150}
        vars={() => ({
          root: {
            "--lightbox-toolbar-height":
              "calc(56px + var(--capy-content-inset-top))",
            "--lightbox-thumbnails-height":
              "calc(88px + var(--capy-safe-area-bottom))",
          },
        })}
        styles={{
          toolbar: {
            paddingTop: "var(--capy-content-inset-top)",
            paddingLeft: "var(--capy-safe-area-left)",
            paddingRight: "var(--capy-safe-area-right)",
          },
          thumbnails: { paddingBottom: "var(--capy-safe-area-bottom)" },
          navigationButton: {
            minWidth: 44,
            minHeight: 44,
            borderRadius: "50%",
            background: "rgba(0, 0, 0, 0.45)",
          },
          toolbarButton: { minWidth: 44, minHeight: 44 },
        }}
      />
    </>
  );
};
