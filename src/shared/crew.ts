export enum CrewServiceType {
  CandidPhoto = 'candid_photo',
  CandidVideo = 'candid_video',
  TraditionalPhotoVideo = 'traditional_photo_video',
  Drone = 'drone',
  SecondaryPhotoVideo = 'secondary_photo_video',
  OutdoorPhotography = 'outdoor_photography',
  OutdoorVideo = 'outdoor_video',
  DJ = 'dj',
  LEDWall = 'led_wall',
  SelfieBooth = 'selfie_booth',
  Spindle360 = '360_spindle',
  LEDTV = 'led_tv',
  EntryDance = 'entry_dance',
  CoalFireEntry = 'coal_fire_entry',
  AdditionalService = 'additional_service',
}

export type BookingCrewMember = {
  serviceType: CrewServiceType;
  staffAccountId: string;
  memberName: string;
};
export type BookingCrewInput = Pick<BookingCrewMember, 'serviceType' | 'staffAccountId'>;

export const CREW_SERVICE_LABELS: Record<CrewServiceType, string> = {
  [CrewServiceType.CandidPhoto]: 'Candid Photo',
  [CrewServiceType.CandidVideo]: 'Candid Video',
  [CrewServiceType.TraditionalPhotoVideo]: 'Traditional Photo/Video',
  [CrewServiceType.Drone]: 'Drone',
  [CrewServiceType.SecondaryPhotoVideo]: 'Secondary Photo/Video',
  [CrewServiceType.OutdoorPhotography]: 'Outdoor Photography',
  [CrewServiceType.OutdoorVideo]: 'Outdoor Video',
  [CrewServiceType.DJ]: 'DJ',
  [CrewServiceType.LEDWall]: 'LED Wall',
  [CrewServiceType.SelfieBooth]: 'Selfie Booth',
  [CrewServiceType.Spindle360]: '360 Spindle',
  [CrewServiceType.LEDTV]: 'LED TV',
  [CrewServiceType.EntryDance]: 'Entry Dance',
  [CrewServiceType.CoalFireEntry]: 'Coal Fire Entry',
  [CrewServiceType.AdditionalService]: 'Additional Service',
};
export const CREW_SERVICE_OPTIONS = Object.values(CrewServiceType).map(value => ({
  value, label: CREW_SERVICE_LABELS[value],
}));
