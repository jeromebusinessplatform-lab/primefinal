import type { ReactNode } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { TelegramProvider } from "./context/TelegramContext.tsx";
import { CartProvider } from "./context/CartContext.tsx";
import { AdminProvider, useAdmin } from "./context/AdminContext.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import GlobalProprietaryFooter from "./components/GlobalProprietaryFooter.tsx";
import OrientationLock from "./components/OrientationLock.tsx";

import ShopLayout from "./pages/shop/layout.tsx";
import ShopCatalog from "./pages/shop/page.tsx";
import CartPage from "./pages/shop/cart.tsx";
import CheckoutPage from "./pages/shop/checkout.tsx";
import OrderConfirmationPage from "./pages/shop/order-confirmation.tsx";
import OrdersPage from "./pages/shop/orders.tsx";
import AccountPage from "./pages/shop/account.tsx";
import SupportPage from "./pages/shop/support.tsx";
import NotificationsPage from "./pages/shop/notifications.tsx";

import AdminLogin from "./pages/admin/login.tsx";
import AdminLayout from "./pages/admin/layout.tsx";
import AdminOrdersPage from "./pages/admin/orders.tsx";
import AdminLogisticsPage from "./pages/admin/logistics.tsx";
import AdminProductsPage from "./pages/admin/products.tsx";
import AdminSettingsPage from "./pages/admin/settings.tsx";
import AdminReceiptOcrPage from "./pages/admin/receipt-ocr.tsx";
import AdminAnalyticsPage from "./pages/admin/analytics.tsx";
import NotFound from "./pages/NotFound.tsx";

function AdminGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAdmin();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <TelegramProvider>
      <CartProvider>
        <AdminProvider>
          <Toaster />
          <OrientationLock />
          <div className="w-full min-h-[100dvh] flex flex-col items-center justify-start bg-neutral-950 overflow-x-hidden">
            <div className="w-full max-w-[412px] min-h-[100dvh] bg-[#f3f4f6] relative flex flex-col shadow-2xl overflow-x-hidden border-x border-neutral-800/20">
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/shop" replace />} />
                  <Route path="/shop" element={<ShopLayout />}>
                    <Route index element={<ShopCatalog />} />
                    <Route path="cart" element={<CartPage />} />
                    <Route path="checkout" element={<CheckoutPage />} />
                    <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="account" element={<AccountPage />} />
                    <Route path="support" element={<SupportPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                  </Route>

                  <Route path="/admin" element={<AdminLogin />} />
                  <Route
                    path="/admin"
                    element={
                      <AdminGuard>
                        <AdminLayout />
                      </AdminGuard>
                    }
                  >
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route path="analytics" element={<AdminAnalyticsPage />} />
                    <Route path="ocr" element={<AdminReceiptOcrPage />} />
                    <Route path="logistics" element={<AdminLogisticsPage />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                    <Route path="*" element={<Navigate to="/admin/orders" replace />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
                <GlobalProprietaryFooter />
              </BrowserRouter>
            </div>
          </div>
        </AdminProvider>
      </CartProvider>
    </TelegramProvider>
  );
}
