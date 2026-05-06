"use client";

import { createBrowserRouter } from "react-router";
import { Layout } from "./Layout";
import { RoleSelector } from "./RoleSelector";
import { AdminDashboard } from "./AdminDashboard";
import { ManagementDashboard } from "./ManagementDashboard";
import { WorkersPortal } from "./WorkersPortal";
import { LegalDashboard } from "./LegalDashboard";
import { ListingPipeline } from "./ListingPipeline";
import { CostLedger } from "./CostLedger";
import { SchedulingHub } from "./SchedulingHub";
import { QualityIssues } from "./QualityIssues";
import { SupportCenter } from "./SupportCenter";
import { VerificationCenter } from "./VerificationCenter";
import { SellerTrends } from "./SellerTrends";
import { ProductReels } from "./ProductReels";
import { KnowledgeBase } from "./KnowledgeBase";
import { TradeCompliance } from "./TradeCompliance";
import { TeamHub } from "./TeamHub";
import { InspectorPortal } from "./InspectorPortal";
import { DisputeCenter } from "./DisputeCenter";

// Admin sub-modules
import { AdminUsers, AdminProducts, AdminLogistics, AdminQuality, AdminSettings } from "./AdminSubModules";

// Management sub-modules
import { ManagementOrders, ManagementDeliveries, ManagementWorkforce, ManagementB2B } from "./ManagementSubModules";

// Legal sub-modules
import { LegalContracts, LegalCompliance, LegalDisputes, LegalRegulations } from "./LegalSubModules";

// Workers sub-modules
import { WorkersTasks, WorkersRoutes, WorkersInspections, WorkersPackaging } from "./WorkersSubModules";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RoleSelector,
  },
  {
    path: "/admin",
    Component: Layout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "users", Component: AdminUsers },
      { path: "products", Component: AdminProducts },
      { path: "logistics", Component: AdminLogistics },
      { path: "quality", Component: AdminQuality },
      { path: "verification", Component: VerificationCenter },
      { path: "settings", Component: AdminSettings },
    ],
  },
  {
    path: "/management",
    Component: Layout,
    children: [
      { index: true, Component: ManagementDashboard },
      { path: "listings", Component: ListingPipeline },
      { path: "scheduling", Component: SchedulingHub },
      { path: "costs", Component: CostLedger },
      { path: "quality-issues", Component: QualityIssues },
      { path: "trends", Component: SellerTrends },
      { path: "reels", Component: ProductReels },
      { path: "orders", Component: ManagementOrders },
      { path: "deliveries", Component: ManagementDeliveries },
      { path: "workforce", Component: ManagementWorkforce },
      { path: "b2b", Component: ManagementB2B },
    ],
  },
  {
    path: "/workers",
    Component: Layout,
    children: [
      { index: true, Component: WorkersPortal },
      { path: "tasks", Component: WorkersTasks },
      { path: "routes", Component: WorkersRoutes },
      { path: "inspections", Component: WorkersInspections },
      { path: "packaging", Component: WorkersPackaging },
    ],
  },
  {
    path: "/legal",
    Component: Layout,
    children: [
      { index: true, Component: LegalDashboard },
      { path: "contracts", Component: LegalContracts },
      { path: "compliance", Component: LegalCompliance },
      { path: "trade-compliance", Component: TradeCompliance },
      { path: "team-hub", Component: TeamHub },
      { path: "disputes", Component: DisputeCenter },
      { path: "regulations", Component: LegalRegulations },
    ],
  },
  {
    path: "/support",
    Component: Layout,
    children: [
      { index: true, Component: SupportCenter },
      { path: "knowledge", Component: KnowledgeBase },
    ],
  },
  {
    path: "/inspector",
    Component: Layout,
    children: [
      { index: true, Component: InspectorPortal },
    ],
  },
  {
    path: "*",
    Component: RoleSelector,
  },
], { basename: "/admin" });