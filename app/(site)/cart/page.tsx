import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { getCustomerFromCookies } from "@/lib/customer-auth";

export const metadata: Metadata = { title: "Cart" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const customer = await getCustomerFromCookies();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      <CartView
        customer={
          customer
            ? {
                name: customer.name,
                email: customer.email ?? "",
                phone: customer.phone,
                company: customer.company,
                address: customer.address,
              }
            : null
        }
      />
    </div>
  );
}
