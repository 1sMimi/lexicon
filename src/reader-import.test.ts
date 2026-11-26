import { describe, expect, it } from 'vitest';
import { vocabulary, parseDocument } from './reader-import';
describe('local reader import', () => {
  it('counts real exact forms without merging meanings or guessing lemmas', () => {
    expect(vocabulary('Lead lead leading LED. Don’t don\'t.')).toEqual([['lead',2],["don't",2],['leading',1],['led',1]]);
  });
  it('reads text locally without treating markup as executable HTML', async () => {
    const text = '<script>alert(1)</script> reader';
    expect(await parseDocument(new File([text], 'chapter.txt'))).toEqual([{title:'chapter.txt',text}]);
  });
  it('rejects unsupported input instead of silently claiming a successful import', async () => {
    await expect(parseDocument(new File(['data'], 'private.exe'))).rejects.toThrow('Supported files');
  });
});

it('extracts actual DOCX text from an OOXML archive', async () => {
  const {default: JSZip} = await import('jszip');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Actual document vocabulary.</w:t></w:r></w:p></w:body></w:document>');
  const buffer = await zip.generateAsync({type:'arraybuffer'});
  const parts = await parseDocument(new File([buffer], 'fixture.docx'));
  expect(parts[0].text).toContain('Actual document vocabulary.');
});
