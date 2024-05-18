import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

for (const envVar of ['SUPABASE_URL', 'SUPABASE_ROLE_KEY'])
  if (!process.env[envVar])
    throw `Must provide the environment variable "${envVar}"`;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY
);

class StatusError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Checks if a mask is valid. Errors if not.
 * @param {string} mask Mask to check
 * @returns {string} Lowercased mask
 */
const requireValidMask = (mask) => {
  if (!mask || typeof mask !== 'string' || !(mask = mask.trim()))
    throw new StatusError(400, 'Please provide an unreputable link.');
  mask = mask.toLowerCase();
  if (mask.length < 6)
    throw new StatusError(400, 'Links should be at least 6 characters');
  if (mask.length > 512)
    throw new StatusError(400, 'Please keep links to 512 characters maximum!');
  const invalidMask = (/[^a-z0-9_-]/g).test(mask);
  if (invalidMask) throw new StatusError(400, 'Invalid mask!');
  return mask;
};

/**
 * Checks if a link is valid. Errors if not.
 * @param {string} link Link to check
 */
const requireValidLink = (link) => {
  if (!link || typeof link !== 'string' || !(link = link.trim()))
    throw new StatusError(400, 'Please provide a valid link.');
  if (link.length > 512)
    throw new StatusError(400, 'Please keep links to 512 characters maximum!');
  const isLinkValid = (/^(?:https?:\/\/)?(?:[a-z0-9_-]+\.)+[a-z]{2,}(?:\/*)?$/gi).test(link);
  if (!isLinkValid) throw new StatusError(400, 'Invalid link!');
};

/**
 * Checks if a mask is available.
 * @param {string} mask Mask to check
 * @returns {Promise<boolean>} Whether the mask is available
 */
const isMaskAvailable = async (mask) => {
  mask = requireValidMask(mask);
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('mask', mask);
  if (error) throw error;
  return !(data && data.length);
};

/**
 * Creates a masked link.
 * @param {string} mask The mask to apply to the link
 * @param {string} actual The link to mask
 * @returns {Promise<void>}
 */
export const createMaskedLink = async (mask, actual) => {
  mask = requireValidMask(mask);
  requireValidLink(actual);
  if (!(await isMaskAvailable(mask)))
    throw new StatusError(400, 'Unreputable URL already taken!');
  const { error } = await supabase
    .from('links')
    .insert([
      { mask, actual }
    ]);
  if (error) throw error;
};

/**
 * Resolves a mask to a link.
 * @param {string} mask The mask to resolve
 * @returns {Promise<string|null>} The unmasked link, or null if it doesn't exist
 */
export const resolveMask = async (mask) => {
  const { data, error } = await supabase
    .from('links')
    .select('actual,hits')
    .eq('mask', mask.toLowerCase());
  if (error) throw error;
  if (data && data.length) {
    try {
      await supabase.from('links')
        .update({ hits: data[0].hits + 1 })
        .eq('mask');
    } catch (e) {
      console.error(e);
    }
    return data[0].actual;
  } else {
    return null;
  }
};
