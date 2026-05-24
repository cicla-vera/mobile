export type AppNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: '1',
    title: 'Dias férteis',
    message: 'Seus dias férteis podem estar começando hoje.',
    time: 'Hoje, 08:00',
    read: false,
  },
  {
    id: '2',
    title: 'Registro diário',
    message: 'Como você está se sentindo hoje? Registre seu humor.',
    time: 'Hoje, 07:30',
    read: false,
  },
  {
    id: '3',
    title: 'Próxima menstruação',
    message: 'Sua próxima menstruação está prevista para daqui a 20 dias.',
    time: 'Ontem, 19:00',
    read: true,
  },
];
