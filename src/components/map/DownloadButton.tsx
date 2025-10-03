import React, { useState } from 'react';
import { generateXML, generateRDF, downloadFile } from '../../utils/dataExport';

interface DownloadButtonProps {
  data: any;
  memberNames?: Record<number, string>;
  wikidataProperties?: Record<string, string>;
  rowPropLabels?: Record<string, string>;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  data, 
  memberNames, 
  wikidataProperties,
  rowPropLabels 
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleDownloadXML = () => {
    const exportData = {
      ...data,
      memberNames,
      wikidataProperties,
      rowPropLabels
    };
    const xml = generateXML(exportData);
    const filename = `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.xml`;
    downloadFile(xml, filename, 'application/xml');
    setShowMenu(false);
  };

  const handleDownloadRDF = () => {
    const exportData = {
      ...data,
      memberNames,
      wikidataProperties,
      rowPropLabels
    };
    const rdf = generateRDF(exportData);
    const filename = `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.rdf`;
    downloadFile(rdf, filename, 'application/rdf+xml');
    setShowMenu(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="download-btn"
        onClick={() => setShowMenu(!showMenu)}
        title="Download data"
      >
        ⬇️
      </button>
      
      {showMenu && (
        <div className="download-menu">
          <button onClick={handleDownloadXML}>
            📄 Download as XML
          </button>
          <button onClick={handleDownloadRDF}>
            🔗 Download as RDF/XML
          </button>
        </div>
      )}
    </div>
  );
};