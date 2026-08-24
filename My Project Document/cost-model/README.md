# Cost model

`cost_model.py` is the script that produced every number in **Costing.docx** and
**SMAART Institute - Cost Overview.pptx**. It is kept here so the figures can be
re-checked and re-run rather than trusted.

```bash
python3 cost_model.py
```

It prints the summary table, then the full line-by-line working for each tier,
including the annual figure and the one-year Savings Plan comparison.

## Changing an assumption

Everything is declared at the top of the file:

| Constant | What it controls |
|---|---|
| `RATE` | The AWS rate card — hourly instance prices, storage, egress, load balancer |
| `ATLAS` | MongoDB Atlas tier prices, as a low/high band |
| `CLOUDINARY` | Media plan prices |
| `TIERS` | The five sizes modelled: registered users, monthly active, peak concurrent |
| `SHAPE` | The infrastructure chosen for each tier |
| `FIRST_LOAD_GB`, `MAU_GB`, `NEW_SHARE` | The traffic model |
| `AI_PER_MAU_LOW/HIGH` | AI spend per active user per month |
| `FX` | Rupees per US dollar |

Change a value, re-run, and the whole model moves with it. Re-check the rate card
against the AWS Pricing Calculator each quarter — published prices move.
