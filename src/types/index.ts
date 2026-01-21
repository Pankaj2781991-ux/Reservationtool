// Types for the Multi-Tenant Reservation System

export interface Tenant {
  id: string;
  slug: string;
  businessName: string;
  email: string;
  phone?: string;
  serviceType: string;
  description?: string;
  createdAt: Date;
  ownerUserId: string;
  subscription: TenantSubscription;
  isDemo?: boolean;
  settings: TenantSettings;
}

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled';

export interface TenantSubscription {
  status: SubscriptionStatus;
  plan: 'starter' | 'pro' | 'enterprise';
  currentPeriodEnd: string; // ISO date string
}

export interface TenantSettings {
  primaryColor: string;
  slotDuration: number; // minutes
  maxAdvanceBookingDays: number;
  workingHoursStart: string; // "09:00"
  workingHoursEnd: string; // "17:00"
  workingDays: number[]; // 0-6, where 0 is Sunday
  logoUrl?: string;
  backgroundUrl?: string;
  publicPhone?: string; // Contact phone shown in user footer
  publicEmail?: string; // Contact email shown in user footer
}

export interface TimeSlot {
  id: string;
  tenantId: string;
  date: string; // ISO date string YYYY-MM-DD
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  capacity: number;
  bookedCount: number;
  isActive: boolean;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  id: string;
  tenantId: string;
  timeSlotId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  notes?: string;
  status: ReservationStatus;
  createdAt: Date;
  date: string;
  startTime: string;
  endTime: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export type UserRole = 'admin' | 'customer';

export interface TenantUser {
  id: string;
  tenantId: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  password: string;
  createdAt: Date;
}
