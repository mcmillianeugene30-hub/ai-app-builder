import { Skeleton } from "@/components/ui/skeleton";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { Layout } from "./components/Layout";

const HomePage = lazy(() => import("./pages/Home"));
const BuilderPage = lazy(() => import("./pages/Builder"));
const MyAppsPage = lazy(() => import("./pages/MyApps"));

function PageLoader() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </Layout>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const builderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/builder",
  validateSearch: (
    search: Record<string, unknown>,
  ): { generationId?: string } => ({
    generationId:
      typeof search.generationId === "string" ? search.generationId : undefined,
  }),
  component: BuilderPage,
});

const myAppsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-apps",
  component: MyAppsPage,
});

const routeTree = rootRoute.addChildren([homeRoute, builderRoute, myAppsRoute]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
