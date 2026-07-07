import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ContainerType } from '../types';

type MCIName = keyof typeof MaterialCommunityIcons.glyphMap;

export const CONTAINERS: { type: ContainerType; label: string; icon: MCIName }[] = [
  { type: 'glass', label: 'Glass', icon: 'cup-water' },
  { type: 'bottle', label: 'Bottle', icon: 'bottle-soda-classic' },
  { type: 'mug', label: 'Mug', icon: 'coffee' },
  { type: 'cup', label: 'Cup', icon: 'cup' },
];

export function containerIconName(type: ContainerType): MCIName {
  return CONTAINERS.find((c) => c.type === type)?.icon ?? 'cup-water';
}

interface ContainerIconProps {
  type: ContainerType;
  size?: number;
  color: string;
}

export function ContainerIcon({ type, size = 22, color }: ContainerIconProps) {
  return <MaterialCommunityIcons name={containerIconName(type)} size={size} color={color} />;
}
