import { SalesToolbar } from '../sales/SalesToolbar';

type EnquiryToolbarProps = Omit<React.ComponentProps<typeof SalesToolbar>, 'itemName'>;

export function EnquiryToolbar(props: EnquiryToolbarProps) {
  return <SalesToolbar {...props} itemName="enquiry" />;
}
