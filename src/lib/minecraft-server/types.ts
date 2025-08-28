/**
 * Options for connecting to a Minecraft server.
 */
export type MinecraftServerOptions = {
  host: string;
  port: number;
  password: string;
};
/**
 * Response structure for commands sent to the Minecraft server client API.
 */
export type MinecraftCommandResponse<T = any> = {
  command: string;
  success: boolean;
  data: T;
  raw: string;
};
/**
 * Root type for a tellraw JSON component.
 * Can be a single component or an array of components.
 */
export type MinecraftTellrawComponent = MinecraftTellrawText | MinecraftTellrawArray;

/**
 * An array of components (concatenated).
 */
export interface MinecraftTellrawArray extends Array<MinecraftTellrawText> {}

/**
 * Base structure for a single text component.
 */
export interface MinecraftTellrawText {
  // Core content options (only one should typically be present)
  text?: string;
  translate?: string;
  score?: { name: string; objective: string; value?: string };
  selector?: string;
  keybind?: string;
  nbt?: string;
  block?: string;
  entity?: string;
  storage?: string;

  // Formatting
  color?:
    | "black"
    | "dark_blue"
    | "dark_green"
    | "dark_aqua"
    | "dark_red"
    | "dark_purple"
    | "gold"
    | "gray"
    | "dark_gray"
    | "blue"
    | "green"
    | "aqua"
    | "red"
    | "light_purple"
    | "yellow"
    | "white"
    | "reset";
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  strikethrough?: boolean;
  obfuscated?: boolean;

  // Extra child components
  extra?: MinecraftTellrawComponent[];

  // Events
  clickEvent?: {
    action: "open_url" | "run_command" | "suggest_command" | "change_page" | "copy_to_clipboard";
    value: string;
  };

  hoverEvent?: {
    action: "show_text" | "show_item" | "show_entity";
    contents: MinecraftTellrawComponent | MinecraftHoverItem | MinecraftHoverEntity;
  };

  insertion?: string; // Text inserted into chat when shift-clicked
}

/**
 * Item shown in hover event (show_item).
 */
export interface MinecraftHoverItem {
  id: string; // namespaced item id (e.g., "minecraft:diamond_sword")
  count?: number;
  tag?: string; // NBT data
}

/**
 * Entity shown in hover event (show_entity).
 */
export interface MinecraftHoverEntity {
  type: string; // namespaced entity id (e.g., "minecraft:zombie")
  id: string;   // UUID
  name?: MinecraftTellrawComponent; // display name
}

/**
 * Time of day options
 */
export type MinecraftTimeOfDay = "day" | "night" | "noon" | "midnight";

export type MinecraftServerOperator = {
  name: string;
  uuid: string;
  level: number;
  bypassesPlayerLimit: boolean;
}

export type MinecraftListDetails = { 
  online: number;
   max: number;
   players: string[];
}

export type MinecraftPlaySession = {
  id: number;
  startTime: number;
  endTime: number;
  active: boolean;
}

export type MinecraftUserSessionsInfo = {
  user: string;
  sessions: MinecraftPlaySession[];
  totalSeconds: number;
  isOnline: boolean;
}