export interface Event {
  id: number;
  name: string;
  type: 'time' | 'distance' | 'height';
  unit: string;
  auto_qualify: number | null;
  prov_qualify: number | null;
  auto_qualify_m: number | null;
  prov_qualify_m: number | null;
  auto_qualify_f: number | null;
  prov_qualify_f: number | null;
  sort_order: number;
}

export interface Bib {
  bib_number: number;
  is_assigned: boolean;
  assigned_to: number | null;
}

export interface Athlete {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  grade: number;
  gender: 'M' | 'F';
  bib_number: number | null;
  coaches_discretion: boolean;
  created_at: string;
}

export interface Performance {
  id: number;
  athlete_id: number;
  event_id: number;
  raw_value: number;
  display_value: string;
  qual_status: 'automatic' | 'provisional' | 'dnq';
  created_at: string;
}

export interface ResultRow {
  id: number;
  athlete_id: number;
  event_id: number;
  raw_value: number;
  display_value: string;
  qual_status: 'automatic' | 'provisional' | 'dnq';
  first_name: string;
  last_name: string;
  bib_number: number | null;
  grade: number;
  gender: 'M' | 'F';
  event_name: string;
  event_type: 'time' | 'distance' | 'height';
  event_unit: string;
  coaches_discretion: boolean;
}

export interface ExportRow {
  first_name: string;
  last_name: string;
  student_id: string;
  grade: number;
  gender: 'M' | 'F';
  bib_number: number | null;
  auto_qualified_events: string;
  prov_qualified_events: string;
}
