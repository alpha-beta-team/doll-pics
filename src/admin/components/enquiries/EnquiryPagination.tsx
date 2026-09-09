import { SalesListPagination } from '../sales/SalesListPagination';

type Props = Omit<React.ComponentProps<typeof SalesListPagination>, 'itemPlural'>;

export function EnquiryPagination(props: Props) {
  return <SalesListPagination {...props} itemPlural="enquiries" />;
}
