import { SkillConfig, SkillId } from '../types';
import { structureSkill } from './structure';
import { brandVisualSkill } from './brand-visual';
import { copyConversionSkill } from './copy-conversion';
import { codeQualitySkill } from './code-quality';

export const ALL_SKILLS: SkillConfig[] = [
  structureSkill,
  brandVisualSkill,
  copyConversionSkill,
  codeQualitySkill,
];

export function getSkill(id: SkillId): SkillConfig {
  const skill = ALL_SKILLS.find((s) => s.id === id);
  if (!skill) throw new Error(`Unknown OpenClaw skill: ${id}`);
  return skill;
}

export { structureSkill, brandVisualSkill, copyConversionSkill, codeQualitySkill };
