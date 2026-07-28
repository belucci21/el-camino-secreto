export type JourneyButtonSurface = {
  id: string;
  visible_label: string;
  secondary_label?: string;
  action: string;
  destination_order?: number;
  notes?: string;
};

export type JourneyScene = {
  order: number;
  id: string;
  asset: {
    filename: string;
    public_asset_path: string;
    width: number;
    height: number;
    bytes: number;
    sha256: string;
  };
  visible_copy: string[];
  button_surfaces: JourneyButtonSurface[];
  transition_to_next?: {
    trigger?: string;
    motion?: string[];
  };
};

export type JourneyReference = {
  title: string;
  couple: string;
  experience_contract: {
    entry_route: string;
    asset_base_path: string;
    sequence: string[];
    primary_viewport: {
      reference_width: number;
      reference_height: number;
    };
  };
  scenes: JourneyScene[];
};

export type JourneyHotspot = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
};
