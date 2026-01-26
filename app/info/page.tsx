"use client";

import Link from "next/link";
import Image from "next/image";
import { Title, Badge, Accordion, Paper, Button } from "@mantine/core";
import { Upload, Printer, MapPin, HelpCircle, Contact } from "lucide-react";

import { Routes } from "@/config";
import { BackButton } from "@/components";
import CapybaraRead from "@/public/images/read.png";

import { Card } from "./card";

export default function Info() {
  return (
    <div className="min-h-dvh flex flex-col bg-linear-to-b from-teal-50 to-white px-4 py-6 gap-8">
      <div>
        <BackButton text="Назад" url={Routes.Home} />
      </div>

      <div className="flex flex-col items-center text-center gap-4">
        <Badge
          size="lg"
          color="teal"
          variant="light"
          leftSection={<HelpCircle size={14} />}
        >
          Как это работает
        </Badge>

        <Title order={2}>Печать файлов в пару шагов</Title>

        <Image src={CapybaraRead} alt="Капибара объясняет" height={200} />

        <p className="text-gray-600 max-w-md">
          Мы сделали сервис максимально простым - вы загружаете файлы, а мы
          аккуратно печатаем их и готовим к выдаче.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Title order={3}>Как пользоваться приложением</Title>

        <Card
          icon={<Upload />}
          title="1. Загрузите файлы"
          text="Нажмите «Новый заказ», выберите документы или фотографии и
                отправьте их на печать."
        />

        <Card
          icon={<Printer />}
          title="2. Мы печатаем"
          text="Мы проверяем файлы, печатаем их и подготавливаем заказ."
        />

        <Card
          icon={<MapPin />}
          title="3. Заберите заказ"
          text="Приходите в точку выдачи и забирайте готовые документы."
        />
      </div>

      <div className="flex flex-col gap-3">
        <Title order={3}>Где мы находимся</Title>

        <Paper radius="md" p="md" withBorder>
          <div className="flex gap-1">
            <MapPin /> <p className="font-medium">Наш адрес</p>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            г. Горловка, ул. Изотова 7
          </p>

          <div className="mt-3 text-sm text-gray-600">
            <p>Ориентиры:</p>
            <ul className="list-disc list-inside">
              <li>рядом магазин &quot;Максим&quot;</li>
              <li>рядом с автобусной остановкой</li>
              <li>центральный рынок и ТД &quot;Донбасс&quot;</li>
              <li>зеленая вывеска с информацией о ксерокопии</li>
            </ul>
          </div>
        </Paper>
      </div>

      <div className="flex flex-col gap-3">
        <Title order={3}>Контакты</Title>

        <Paper radius="md" p="md" withBorder>
          <div className="flex gap-1">
            <Contact />
            <p className="font-medium">Наши контакты</p>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <Button
              radius="md"
              color="blue"
              target="_blank"
              component={Link}
              href="https://t.me/fotomail24"
            >
              Написать в телеграме
            </Button>
            <Button
              radius="md"
              color="blue"
              target="_blank"
              component={Link}
              href="https://vk.com/kopibara24"
            >
              Группа в ВК
            </Button>
          </div>
        </Paper>
      </div>

      <div className="flex flex-col gap-3">
        <Title order={3}>Частые вопросы</Title>

        <Accordion radius="md" variant="contained">
          <Accordion.Item value="formats">
            <Accordion.Control>
              Какие форматы файлов поддерживаются?
            </Accordion.Control>
            <Accordion.Panel>
              PDF, JPG, PNG, DOCX и XLSX. Если файл нестандартный — попробуйте
              сохранить его в PDF.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="color">
            <Accordion.Control>Можно ли печатать в цвете?</Accordion.Control>
            <Accordion.Panel>
              Да, цветная и черно-белая печать доступны при оформлении заказа.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="time">
            <Accordion.Control>
              Сколько времени занимает печать?
            </Accordion.Control>
            <Accordion.Panel>
              Обычно от 5 до 15 минут, в зависимости от количества страниц и
              загруженности нашей точки.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="payment">
            <Accordion.Control>Как происходит оплата?</Accordion.Control>
            <Accordion.Panel>
              Оплата производится при получении заказа.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="location">
            <Accordion.Control>Где можно забрать заказ?</Accordion.Control>
            <Accordion.Panel>
              Забрать заказ вы можете по адресу - г.Горловка, ул. Изотова 7
              (Центральный рынок)
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="schedule">
            <Accordion.Control>Какой график работы?</Accordion.Control>
            <Accordion.Panel>
              Вторник - Пятница: с 8:00 до 13:30
              <br />
              Суббота - Воскресенье: с 8:00 до 12:00
              <br />
              Понедельник выходной.
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </div>

      <Button
        radius="md"
        color="teal"
        target="_blank"
        component={Link}
        leftSection={<MapPin size={16} />}
        href="https://yandex.ru/maps/?rtext=~48.303479,38.033977&rtt=pedestrian"
      >
        Построить маршрут
      </Button>
    </div>
  );
}
