import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Dashboard: undefined;
  Clients: undefined;
  Policies: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  ClientForm: { clientId?: number } | undefined;
  ClientDetail: { clientId: number };
  PolicyForm: { policyId?: number; clientId?: number } | undefined;
  PolicyDetail: { policyId: number };
  PaymentForm: { policyId: number };
  Meetings: undefined;
  MeetingForm: { meetingId?: number; clientId?: number; policyId?: number } | undefined;
  MeetingDetail: { meetingId: number };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
