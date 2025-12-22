import { ProductForm } from '@/features/products/components/product-form';

interface EditProductPageProps {
  params: {
    productId: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  return <ProductForm productId={params.productId} />;
}
