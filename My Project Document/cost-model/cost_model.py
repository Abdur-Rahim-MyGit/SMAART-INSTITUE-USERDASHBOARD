"""SMAART Institute cost model — ap-south-1 (Mumbai), on-demand list prices.

Every rate is declared once here so the whole model can be re-run against a new
rate card. Outputs the tables used by the Costing document and the deck.
"""
HRS = 730          # billing hours per month
FX  = 88.0         # INR per USD (assumption, stated in the document)

RATE = {
    # EC2 on-demand, Linux, ap-south-1
    't3.small'  : 0.0224,
    't3.medium' : 0.0448,
    't3.large'  : 0.0896,
    't3.xlarge' : 0.1792,
    # Storage
    'gp3_gb'      : 0.0912,    # per GB-month
    'snapshot_gb' : 0.05,      # per GB-month
    # Network
    'ipv4_hr'     : 0.005,     # every public IPv4, incl. Elastic IP
    'dto_gb'      : 0.1093,    # data transfer out to internet, beyond free tier
    'dto_free_gb' : 100,       # account-wide free egress per month
    'alb_hr'      : 0.0225,
    'alb_lcu_hr'  : 0.008,
    'cf_gb'       : 0.109,     # CloudFront India price class, per GB
    # Managed bits
    'r53_zone'    : 0.50,
    'cw'          : 5.00,      # CloudWatch logs+metrics, flat allowance
    's3_gb'       : 0.025,
}

# MongoDB Atlas dedicated tiers on AWS. Mumbai carries a premium over us-east-1;
# a low/high band is carried rather than a single false-precision number.
ATLAS = {
    'M0' : (0,    0),      # free shared tier - pilot and development only
    'M2' : (9,    12),
    'M10': (60,   80),
    'M20': (150,  190),
    'M30': (400,  460),
}

CLOUDINARY = {'free': 0, 'plus': 99, 'advanced': 249}

TIERS = [
    # key, label, registered, MAU, peak concurrent
    ('A', 'Pilot',          10,   10,    2),
    ('B', 'One college',    500,  350,  25),
    ('C', 'Growing',        1000, 700,  50),
    ('D', 'Multi-college',  2500, 1750, 125),
    ('E', 'Scale',          5000, 3500, 250),
]

SHAPE = {
    #        instances,      gp3 GB each, alb, atlas, cloudinary, cloudfront
    'A': (('t3.small',  1),  40,  False, 'M0',  'free',     False),
    'B': (('t3.medium', 1),  40,  False, 'M10', 'free',     False),
    'C': (('t3.large',  1),  60,  False, 'M10', 'plus',     False),
    'D': (('t3.large',  2),  60,  True,  'M20', 'plus',     True),
    'E': (('t3.xlarge', 2),  80,  True,  'M30', 'advanced', True),
}

# Traffic model ------------------------------------------------------------
# A returning student pulls mostly JSON plus cached assets. A NEW student also
# downloads the in-browser proctoring model assets once (~218 MB), which is the
# single largest egress item and the reason CloudFront earns its place at scale.
FIRST_LOAD_GB = 0.25
MAU_GB        = 0.06
NEW_SHARE     = 0.20      # new users per month as a share of the registered base

# AI usage: coach chats, profile analysis, learning plans. Priced per active
# user per month against a low-cost hosted model.
AI_PER_MAU_LOW  = 0.02
AI_PER_MAU_HIGH = 0.08

# Email: Amazon SES at $0.10 per 1,000 messages. ~6 messages per MAU per month.
SES_PER_1K = 0.10
MAIL_PER_MAU = 6


def money(x):
    return round(x, 2)


def model(key):
    label = dict((t[0], t[1]) for t in TIERS)[key]
    reg, mau, peak = [(t[2], t[3], t[4]) for t in TIERS if t[0] == key][0]
    (itype, icount), gb, alb, atlas, cdn_plan, use_cf = SHAPE[key]

    rows = []
    ec2 = RATE[itype] * HRS * icount
    rows.append((f'EC2 — {icount} x {itype}', ec2))

    ebs = RATE['gp3_gb'] * gb * icount
    rows.append((f'EBS gp3 — {icount} x {gb} GB', ebs))

    snap = RATE['snapshot_gb'] * gb * icount * 0.6   # incremental snapshots
    rows.append(('EBS snapshots (daily, incremental)', snap))

    ips = RATE['ipv4_hr'] * HRS * (1 if not alb else icount)
    rows.append(('Public IPv4 address(es)', ips))

    egress_gb = (reg * NEW_SHARE * FIRST_LOAD_GB) + (mau * MAU_GB)
    if use_cf:
        cf = egress_gb * RATE['cf_gb']
        rows.append((f'CloudFront — {egress_gb:.0f} GB delivered', cf))
        dto = 0.0
        rows.append(('EC2 data transfer out (behind CDN)', dto))
    else:
        billable = max(0.0, egress_gb - RATE['dto_free_gb'])
        dto = billable * RATE['dto_gb']
        rows.append((f'Data transfer out — {egress_gb:.0f} GB ({billable:.0f} GB billable)', dto))
        cf = 0.0

    if alb:
        lcu = max(1.0, peak / 40.0)      # rough LCU from concurrency
        albc = RATE['alb_hr'] * HRS + RATE['alb_lcu_hr'] * HRS * lcu
        rows.append(('Application Load Balancer', albc))
    else:
        albc = 0.0

    rows.append(('Route 53 hosted zone', RATE['r53_zone']))
    rows.append(('CloudWatch logs and metrics', 0.0 if key == 'A' else RATE['cw']))
    s3 = RATE['s3_gb'] * (10 if key in 'AB' else 40)
    rows.append(('S3 — offsite backup bucket', s3))

    aws_total = sum(v for _, v in rows)

    atlas_lo, atlas_hi = ATLAS[atlas]
    cdn = CLOUDINARY[cdn_plan]
    ai_lo, ai_hi = mau * AI_PER_MAU_LOW, mau * AI_PER_MAU_HIGH
    mail = mau * MAIL_PER_MAU / 1000 * SES_PER_1K
    github = 0 if key in 'AB' else 16     # GitHub Team, 4 seats
    domain = 12 / 12

    third_lo = atlas_lo + cdn + ai_lo + mail + github + domain
    third_hi = atlas_hi + cdn + ai_hi + mail + github + domain

    sp_saving = ec2 * 0.30      # 1-year no-upfront Compute Savings Plan
    return {
        'ec2': money(ec2), 'sp_saving': money(sp_saving),
        'key': key, 'label': label, 'reg': reg, 'mau': mau, 'peak': peak,
        'shape': f'{icount} x {itype}' + (' + ALB' if alb else ''),
        'atlas': atlas, 'cloudinary': cdn_plan, 'egress_gb': egress_gb,
        'rows': [(n, money(v)) for n, v in rows],
        'aws': money(aws_total),
        'third': [
            (f'MongoDB Atlas {atlas}', atlas_lo, atlas_hi),
            (f'Cloudinary ({cdn_plan})', cdn, cdn),
            ('AI model usage', money(ai_lo), money(ai_hi)),
            ('Email (Amazon SES)', money(mail), money(mail)),
            ('GitHub Team (4 seats)', github, github),
            ('Domain', money(domain), money(domain)),
            ('Docker / Let\'s Encrypt / Nginx', 0, 0),
        ],
        'third_lo': money(third_lo), 'third_hi': money(third_hi),
        'total_lo': money(aws_total + third_lo),
        'total_hi': money(aws_total + third_hi),
        'committed_lo': money(aws_total + third_lo - sp_saving),
        'committed_hi': money(aws_total + third_hi - sp_saving),
    }


if __name__ == '__main__':
    out = [model(k) for k, *_ in TIERS]
    print(f"{'Tier':<16}{'Users':>7}{'Shape':>22}{'AWS':>10}{'Other':>16}{'Total/mo':>18}{'Per user':>10}")
    for m in out:
        per = m['total_hi'] / m['reg']
        print(f"{m['key']+' '+m['label']:<16}{m['reg']:>7}{m['shape']:>22}"
              f"{'$'+str(m['aws']):>10}"
              f"{'$'+str(m['third_lo'])+'-'+str(m['third_hi']):>16}"
              f"{'$'+str(m['total_lo'])+'-'+str(m['total_hi']):>18}"
              f"{'$'+str(round(per,2)):>10}")
    print()
    for m in out:
        print('='*70)
        print(m['key'], m['label'], '| registered', m['reg'], '| MAU', m['mau'],
              '| peak', m['peak'], '| egress', round(m['egress_gb']), 'GB')
        for n, v in m['rows']:
            print(f'   {n:<52}{v:>8.2f}')
        print(f'   {"AWS SUBTOTAL":<52}{m["aws"]:>8.2f}')
        for n, lo, hi in m['third']:
            print(f'   {n:<52}{lo:>8.2f} - {hi:.2f}')
        print(f'   {"TOTAL":<52}{m["total_lo"]:>8.2f} - {m["total_hi"]:.2f}   '
              f'(INR {m["total_lo"]*FX:,.0f} - {m["total_hi"]*FX:,.0f})')
        print(f'   {"ANNUAL":<52}{m["total_lo"]*12:>8.0f} - {m["total_hi"]*12:.0f}')
        print(f'   {"WITH 1-YR SAVINGS PLAN (monthly)":<52}{m["committed_lo"]:>8.2f} - {m["committed_hi"]:.2f}')
