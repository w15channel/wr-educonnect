import { requireAdmin, callCodeApi, errorResponse } from '../../shared/codeFileTools.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const user = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));

    if (body?.confirm !== true) {
      return Response.json({
        success: false,
        confirmation_required: true,
        status: 'not_started',
        message: 'Confirme a publicação enviando confirm: true.',
      }, { status: 400 });
    }

    const deploy = await callCodeApi('deploy', {}, { appEndpoint: true });
    return Response.json({
      success: true,
      status: 'deployed',
      deployed_by: user.email,
      app_id: deploy.app_id,
      checkpoint_id: deploy.checkpoint_id ?? null,
      git_commit_hash: deploy.git_commit_hash,
      deployed_at: deploy.deployed_at,
    });
  } catch (error) {
    return errorResponse(error);
  }
}