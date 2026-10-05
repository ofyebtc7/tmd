import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.6'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface RastreamentoRecord {
  id: string
  pedido_id: string
  status: string
  liberado_em: string | null
}

interface PedidoRow {
  id: string
  numero_pedido: string
  token_rastreamento: string
  clientes: { email: string; nome: string } | { email: string; nome: string }[]
}

serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const siteUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL')

  if (!supabaseUrl || !supabaseKey || !resendApiKey || !siteUrl) {
    console.error('env_ausente', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      hasResend: !!resendApiKey,
      hasSiteUrl: !!siteUrl,
    })
    return new Response(JSON.stringify({ erro: 'Variáveis de ambiente ausentes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 1. Buscar rastreamentos liberados
  const { data: rastreamentos, error: erroRastreamentos } = await supabase
    .from('rastreamentos')
    .select('id, pedido_id, status, liberado_em')
    .lte('liberado_em', new Date().toISOString())

  if (erroRastreamentos) {
    console.error('erro_buscar_rastreamentos', erroRastreamentos)
    return new Response(JSON.stringify({ erro: erroRastreamentos.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!rastreamentos || rastreamentos.length === 0) {
    console.log('nenhum_rastreamento_liberado')
    return new Response(JSON.stringify({ processados: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2. Buscar pedidos + clientes para todos os rastreamentos de uma vez
  const pedidosIds = [...new Set(rastreamentos.map((r) => r.pedido_id))]

  const { data: pedidosData, error: erroPedidos } = await supabase
    .from('pedidos')
    .select(
      `
      id,
      numero_pedido,
      token_rastreamento,
      clientes ( email, nome )
    `
    )
    .in('id', pedidosIds)

  if (erroPedidos) {
    console.error('erro_buscar_pedidos', erroPedidos)
    return new Response(JSON.stringify({ erro: erroPedidos.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const pedidosMap = new Map<
    string,
    { numero_pedido: string; token_rastreamento: string; email: string; nome: string }
  >()

  for (const row of (pedidosData ?? []) as PedidoRow[]) {
    const cliente = Array.isArray(row.clientes) ? row.clientes[0] : row.clientes
    if (!cliente?.email) continue

    pedidosMap.set(row.id, {
      numero_pedido: row.numero_pedido,
      token_rastreamento: row.token_rastreamento,
      email: cliente.email,
      nome: cliente.nome,
    })
  }

  // 3. Buscar registros já enviados para evitar duplicação
  const { data: enviadosData } = await supabase
    .from('emails_enviados')
    .select('pedido_id')
    .eq('tipo', 'rastreio_liberado')
    .in('pedido_id', pedidosIds)

  const enviadosSet = new Set((enviadosData ?? []).map((e) => e.pedido_id))

  let processados = 0
  let erros = 0

  for (const rastreamento of rastreamentos) {
    const pedidoInfo = pedidosMap.get(rastreamento.pedido_id)
    if (!pedidoInfo) {
      console.warn('pedido_nao_encontrado', { pedido_id: rastreamento.pedido_id })
      continue
    }

    if (enviadosSet.has(rastreamento.pedido_id)) {
      console.log('ja_enviado', { pedido_id: rastreamento.pedido_id })
      continue
    }

    // 4. Montar e enviar e-mail via Resend
    const rastreioUrl = `${siteUrl.replace(/\/+$/, '')}/rastreio/${pedidoInfo.token_rastreamento}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background-color:#F2F2F2;font-family:Georgia,'Times New Roman',serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F2F2;padding:40px 16px;">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid rgba(0,0,0,0.06);">
                  <tr>
                    <td style="padding:40px 32px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom:8px;">
                            <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.22em;color:#006DAA;">
                              Cuprum Labs
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-bottom:24px;">
                            <h1 style="margin:0;font-size:22px;color:#14213D;font-weight:600;">
                              Seu pedido já pode ser rastreado!
                            </h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom:16px;font-size:14px;color:#5B6B7C;line-height:1.6;">
                            Ol&aacute; <strong style="color:#14213D;">${pedidoInfo.nome}</strong>,
                            <br><br>
                            O pedido <strong style="color:#14213D;">#${pedidoInfo.numero_pedido}</strong>
                            foi liberado e voc&ecirc; j&aacute; pode acompanhar o status de entrega.
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding:8px 0 24px;">
                            <a href="${rastreioUrl}"
                               style="display:inline-block;padding:14px 36px;background-color:#0B2036;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;font-family:Arial,Helvetica,sans-serif;">
                              Rastrear pedido
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top:16px;border-top:1px solid rgba(0,0,0,0.06);font-size:12px;color:#5B6B7C;line-height:1.5;">
                            Se o bot&atilde;o n&atilde;o funcionar, copie este link no navegador:
                            <br>
                            <span style="color:#006DAA;">${rastreioUrl}</span>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-top:20px;font-size:11px;color:#5B6B7C;letter-spacing:0.08em;">
                            CUPRUM LABS BRASIL
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    let emailEnviado = false

    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Cuprum Labs <noreply@cuprumlabs.com.br>',
          to: pedidoInfo.email,
          subject: 'Seu pedido já pode ser rastreado!',
          html: htmlContent,
        }),
      })

      if (!resendResponse.ok) {
        const erroBody = await resendResponse.text()
        throw new Error(`Resend error ${resendResponse.status}: ${erroBody}`)
      }

      emailEnviado = true
      console.log('email_enviado', {
        pedido_id: rastreamento.pedido_id,
        destinatario: pedidoInfo.email,
      })
    } catch (erro) {
      console.error('erro_enviar_email', {
        pedido_id: rastreamento.pedido_id,
        erro: erro instanceof Error ? erro.message : String(erro),
      })
      erros++
    }

    // 5. Registrar o envio (com status de sucesso ou falha)
    const { error: erroInsert } = await supabase.from('emails_enviados').insert({
      pedido_id: rastreamento.pedido_id,
      tipo: 'rastreio_liberado',
      destinatario: pedidoInfo.email,
      status: emailEnviado ? 'enviado' : 'falhou',
    })

    if (erroInsert) {
      console.error('erro_registrar_email_enviado', {
        pedido_id: rastreamento.pedido_id,
        erro: erroInsert,
      })
      erros++
    } else {
      processados++
    }

    if (!emailEnviado) {
      // Marca o pedido_ids ja processados para nao tentar de novo (ja registramos como falhou)
      enviadosSet.add(rastreamento.pedido_id)
    }
  }

  const resultado = { processados, erros, total: rastreamentos.length }

  console.log('processamento_concluido', resultado)
  return new Response(JSON.stringify(resultado), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
