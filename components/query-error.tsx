import { Alert, Button, Text } from "@mantine/core";

export const QueryError = ({
  title,
  refetch,
}: {
  title: string;
  refetch: () => unknown;
}) => (
  <Alert color="red" title={title} role="alert">
    <Text>Проверьте интернет и попробуйте ещё раз.</Text>
    <Button className="mt-4" onClick={() => void refetch()}>
      Повторить
    </Button>
  </Alert>
);
