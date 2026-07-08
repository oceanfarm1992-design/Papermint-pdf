/**
 * Minimal OOXML / EPUB writers built directly on JSZip.
 * These generate small, valid files without any server or heavyweight library.
 */
import JSZip from 'jszip'
import { escapeXml } from '@/utils/pdfText'

// ─────────────────────────── DOCX ───────────────────────────

export interface DocxParagraph {
  text: string
  heading?: 1 | 2
  /** when set, cells are laid out with tab stops (preserves simple columns) */
  columns?: string[]
}

export interface DocxTable {
  table: string[][]
}

export type DocxBlock = DocxParagraph | DocxTable

function isTable(b: DocxBlock): b is DocxTable {
  return 'table' in b
}

/** usable page width for A4 minus 2cm margins, in twentieths of a point (dxa) */
const CONTENT_WIDTH_DXA = 11906 - 1134 * 2

function paragraphXml(p: DocxParagraph): string {
  const style = p.heading ? `<w:pStyle w:val="Heading${p.heading}"/>` : ''
  const runProps = p.heading ? `<w:rPr><w:b/><w:sz w:val="${p.heading === 1 ? 36 : 28}"/></w:rPr>` : ''
  if (p.columns && p.columns.length > 1) {
    // Tab-separated columns: define evenly spaced tab stops across the page
    const cols = p.columns.length
    const step = Math.floor(CONTENT_WIDTH_DXA / cols)
    const tabs = Array.from({ length: cols - 1 }, (_, i) => `<w:tab w:val="left" w:pos="${step * (i + 1)}"/>`).join('')
    const runs = p.columns
      .map((c, i) => `${i > 0 ? '<w:r><w:tab/></w:r>' : ''}<w:r>${runProps}<w:t xml:space="preserve">${escapeXml(c)}</w:t></w:r>`)
      .join('')
    return `<w:p><w:pPr><w:tabs>${tabs}</w:tabs></w:pPr>${runs}</w:p>`
  }
  return `<w:p>${style ? `<w:pPr>${style}</w:pPr>` : ''}<w:r>${runProps}<w:t xml:space="preserve">${escapeXml(p.text)}</w:t></w:r></w:p>`
}

function tableXml(rows: string[][]): string {
  const cols = rows.reduce((m, r) => Math.max(m, r.length), 1)
  const colW = Math.floor(CONTENT_WIDTH_DXA / cols)
  const grid = Array.from({ length: cols }, () => `<w:gridCol w:w="${colW}"/>`).join('')
  const border = '<w:top w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/><w:left w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/><w:right w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>'
  const trs = rows
    .map((cells) => {
      const tcs = Array.from({ length: cols }, (_, c) => {
        const value = cells[c] ?? ''
        return `<w:tc><w:tcPr><w:tcW w:w="${colW}" w:type="dxa"/></w:tcPr><w:p><w:r><w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r></w:p></w:tc>`
      }).join('')
      return `<w:tr>${tcs}</w:tr>`
    })
    .join('')
  return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="${CONTENT_WIDTH_DXA}" w:type="dxa"/><w:tblBorders>${border}</w:tblBorders></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${trs}</w:tbl>`
}

export async function buildDocx(blocks: DocxBlock[], title: string): Promise<Blob> {
  const zip = new JSZip()

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`,
  )

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`,
  )

  zip.file(
    'docProps/core.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>${escapeXml(title)}</dc:title>
</cp:coreProperties>`,
  )

  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  )

  zip.file(
    'word/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:rPr><w:b/><w:sz w:val="36"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>
      </w:tblBorders>
    </w:tblPr>
  </w:style>
</w:styles>`,
  )

  const body = blocks.map((b) => (isTable(b) ? tableXml(b.table) : paragraphXml(b))).join('\n')

  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${body}
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>
  </w:body>
</w:document>`,
  )

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  })
}

// ─────────────────────────── XLSX ───────────────────────────

export async function buildXlsx(rows: string[][], sheetName: string): Promise<Blob> {
  const zip = new JSZip()

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
  )

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  )

  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${escapeXml(sheetName.slice(0, 31) || 'Sheet1')}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
  )

  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
  )

  const colLetter = (n: number): string => {
    let s = ''
    let x = n
    while (x >= 0) {
      s = String.fromCharCode(65 + (x % 26)) + s
      x = Math.floor(x / 26) - 1
    }
    return s
  }

  const sheetRows = rows
    .map((cells, r) => {
      const cellsXml = cells
        .map((value, c) => {
          const ref = `${colLetter(c)}${r + 1}`
          const num = Number(value.replace(/[,\s]/g, ''))
          if (value !== '' && Number.isFinite(num) && /^-?[\d,.\s]+$/.test(value)) {
            return `<c r="${ref}"><v>${num}</v></c>`
          }
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`
        })
        .join('')
      return `<row r="${r + 1}">${cellsXml}</row>`
    })
    .join('\n')

  zip.file(
    'xl/worksheets/sheet1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
${sheetRows}
  </sheetData>
</worksheet>`,
  )

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE',
  })
}

// ─────────────────────────── PPTX ───────────────────────────

export interface PptxSlideImage {
  pngBytes: Uint8Array
  /** pixel dimensions of the image */
  width: number
  height: number
}

/** Build a .pptx where each slide is one full-bleed page image. */
export async function buildPptx(slides: PptxSlideImage[]): Promise<Blob> {
  const zip = new JSZip()
  const first = slides[0]
  // Slide size in EMU (English Metric Units) — match the first page's aspect
  const EMU_PER_PX = 9525
  const slideW = Math.round((first?.width ?? 960) * EMU_PER_PX)
  const slideH = Math.round((first?.height ?? 540) * EMU_PER_PX)

  const slideOverrides = slides
    .map(
      (_s, i) =>
        `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
    )
    .join('\n  ')

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slideOverrides}
</Types>`,
  )

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`,
  )

  const slideRels = slides
    .map(
      (_s, i) =>
        `<Relationship Id="rIdS${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`,
    )
    .join('\n  ')

  zip.file(
    'ppt/_rels/presentation.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdM" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${slideRels}
</Relationships>`,
  )

  const slideIdList = slides
    .map((_s, i) => `<p:sldId id="${256 + i}" r:id="rIdS${i + 1}"/>`)
    .join('')

  zip.file(
    'ppt/presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rIdM"/></p:sldMasterIdLst>
  <p:sldIdLst>${slideIdList}</p:sldIdLst>
  <p:sldSz cx="${slideW}" cy="${slideH}"/>
  <p:notesSz cx="${slideH}" cy="${slideW}"/>
</p:presentation>`,
  )

  const emptySpTree = `<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree>`

  zip.file(
    'ppt/slideMasters/slideMaster1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>${emptySpTree}</p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`,
  )

  zip.file(
    'ppt/slideMasters/_rels/slideMaster1.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`,
  )

  zip.file(
    'ppt/slideLayouts/slideLayout1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" type="blank">
  <p:cSld>${emptySpTree}</p:cSld>
  <p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr>
</p:sldLayout>`,
  )

  zip.file(
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`,
  )

  zip.file(
    'ppt/theme/theme1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Minimal">
  <a:themeElements>
    <a:clrScheme name="Minimal">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F1F1F"/></a:dk2>
      <a:lt2><a:srgbClr val="EEEEEE"/></a:lt2>
      <a:accent1><a:srgbClr val="10B981"/></a:accent1>
      <a:accent2><a:srgbClr val="0EA5E9"/></a:accent2>
      <a:accent3><a:srgbClr val="8B5CF6"/></a:accent3>
      <a:accent4><a:srgbClr val="F59E0B"/></a:accent4>
      <a:accent5><a:srgbClr val="EF4444"/></a:accent5>
      <a:accent6><a:srgbClr val="14B8A6"/></a:accent6>
      <a:hlink><a:srgbClr val="0563C1"/></a:hlink>
      <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Minimal">
      <a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Minimal">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`,
  )

  slides.forEach((slide, i) => {
    const n = i + 1
    zip.file(`ppt/media/image${n}.png`, slide.pngBytes)
    zip.file(
      `ppt/slides/_rels/slide${n}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${n}.png"/>
</Relationships>`,
    )
    const w = Math.round(slide.width * EMU_PER_PX)
    const h = Math.round(slide.height * EMU_PER_PX)
    zip.file(
      `ppt/slides/slide${n}.xml`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="2" name="Page ${n}"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
</p:sld>`,
    )
  })

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    compression: 'DEFLATE',
  })
}

// ─────────────────────────── EPUB ───────────────────────────

export interface EpubChapter {
  title: string
  paragraphs: string[]
}

export async function buildEpub(chapters: EpubChapter[], bookTitle: string): Promise<Blob> {
  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
  )

  const uid = `papermint-${Date.now()}`
  const manifestItems = chapters
    .map((_c, i) => `<item id="ch${i + 1}" href="ch${i + 1}.xhtml" media-type="application/xhtml+xml"/>`)
    .join('\n    ')
  const spineItems = chapters.map((_c, i) => `<itemref idref="ch${i + 1}"/>`).join('\n    ')

  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${uid}</dc:identifier>
    <dc:title>${escapeXml(bookTitle)}</dc:title>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="style.css" media-type="text/css"/>
    ${manifestItems}
  </manifest>
  <spine>
    ${spineItems}
  </spine>
</package>`,
  )

  zip.file(
    'OEBPS/style.css',
    `body{font-family:serif;line-height:1.6;margin:1em}h1,h2{font-family:sans-serif}p{margin:0 0 0.8em}`,
  )

  const navList = chapters
    .map((c, i) => `<li><a href="ch${i + 1}.xhtml">${escapeXml(c.title)}</a></li>`)
    .join('\n        ')
  zip.file(
    'OEBPS/nav.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head><title>Contents</title><link rel="stylesheet" href="style.css"/></head>
  <body>
    <nav epub:type="toc"><h1>Contents</h1>
      <ol>
        ${navList}
      </ol>
    </nav>
  </body>
</html>`,
  )

  chapters.forEach((c, i) => {
    const paras = c.paragraphs.map((p) => `<p>${escapeXml(p)}</p>`).join('\n      ')
    zip.file(
      `OEBPS/ch${i + 1}.xhtml`,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>${escapeXml(c.title)}</title><link rel="stylesheet" href="style.css"/></head>
  <body>
    <h2>${escapeXml(c.title)}</h2>
      ${paras}
  </body>
</html>`,
    )
  })

  return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip', compression: 'DEFLATE' })
}
