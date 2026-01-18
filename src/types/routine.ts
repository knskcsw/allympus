/**
 * Types for Routine page and related components
 */

export type TemplateItem = {
  id: string;
  title: string;
};

export type RoutineTask = {
  id: string;
  title: string;
};

/**
 * Base type for editable items with id and title
 */
export type EditableItem = {
  id: string;
  title: string;
};
