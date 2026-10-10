"use client";

import { Overlay, Progress, Loader, Text } from "@mantine/core";

import { ProcessStage } from "./types";

interface OrderLoaderProps {
  visible: boolean;
  progress?: number;
  stage: ProcessStage;
}

export const OrderLoader = ({
  stage,
  visible,
  progress = 0,
}: OrderLoaderProps) => {
  if (!visible) return null;

  const isUploading = stage === "uploading";

  return (
    <>
      <Overlay fixed zIndex={400} color="#ffffff" opacity={1} />

      <div className="fixed inset-0 z-401 flex items-center justify-center">
        <div className="w-full max-w-sm px-6 text-center">
          {isUploading ? (
            <>
              <Text size="lg" fw={500} className="mb-4">
                {progress >= 100 ? "Завершаем загрузку" : "Загрузка файлов"}
              </Text>
              <Progress
                striped
                animated
                size="lg"
                radius="xl"
                value={progress}
              />
              <Text size="sm" c="dimmed" className="mt-2">
                {progress}%
              </Text>
            </>
          ) : (
            <>
              <Loader size="lg" className="mx-auto mb-4" />
              <Text size="lg" fw={500}>
                Создаём заказ
              </Text>
              <Text size="sm" c="dimmed" className="mt-1">
                Пожалуйста, подождите
              </Text>
            </>
          )}
        </div>
      </div>
    </>
  );
};
