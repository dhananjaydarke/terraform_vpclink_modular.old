locals {
  validation_domains = toset(concat(
    [var.domain_name],
    var.san_names
  ))
  dvo_map = {
    for d in var.domain_validation_options :
    d.domain_name => d
  }
}


resource "aws_route53_record" "domain_records" {
  for_each = local.validation_domains

  zone_id         = var.zone_id
  allow_overwrite = true
  ttl             = 60

  name = local.dvo_map[each.key].resource_record_name
  type = local.dvo_map[each.key].resource_record_type
  records = [
    local.dvo_map[each.key].resource_record_value
  ]
}

resource "aws_acm_certificate_validation" "cert_validation" {
  certificate_arn = var.certificate_arn
  validation_record_fqdns = [
    for rec in aws_route53_record.domain_records : rec.fqdn
  ]
}
