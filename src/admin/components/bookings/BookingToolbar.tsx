import { SalesToolbar } from '../sales/SalesToolbar';

type BookingToolbarProps = Omit<React.ComponentProps<typeof SalesToolbar>, 'itemName'>;

export function BookingToolbar(props: BookingToolbarProps) {
  return <SalesToolbar {...props} itemName="booking" />;
}
