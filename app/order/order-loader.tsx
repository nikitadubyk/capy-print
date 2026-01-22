"use client";

import { Overlay, Progress, Loader } from "@mantine/core";

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
              <p className="mb-4 text-lg font-medium">Загрузка файлов</p>
              <Progress
                striped
                animated
                size="lg"
                radius="xl"
                value={progress}
              />
              <p className="mt-2 text-sm text-gray-500">{progress}%</p>
            </>
          ) : (
            <>
              <Loader size="lg" className="mx-auto mb-4" />
              <p className="text-lg font-medium">Создаём заказ</p>
              <p className="mt-1 text-sm text-gray-500">
                Пожалуйста, подождите
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};
