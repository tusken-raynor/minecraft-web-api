import { json } from "@sveltejs/kit";

export default () => {
  return json({ success: false, message: 'API endpoint not found' }, { status: 404 });  
}