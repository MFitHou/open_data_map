/**
 * Copyright (C) 2025 MFitHou
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState } from 'react';
import { generateXML, generateRDF, downloadFile } from '../../utils/dataExport';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFileCode, faLink } from '@fortawesome/free-solid-svg-icons';
import '../../styles/components/DownloadButton.css';

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
    <div className="download-button-container">
      <button 
        className="download-btn"
        onClick={() => setShowMenu(!showMenu)}
        title="Download data"
      >
        <FontAwesomeIcon icon={faDownload} />
      </button>
      
      {showMenu && (
        <div className="download-menu">
          <button onClick={handleDownloadXML}>
            <FontAwesomeIcon icon={faFileCode} /> Download as XML
          </button>
          <button onClick={handleDownloadRDF}>
            <FontAwesomeIcon icon={faLink} /> Download as RDF/XML
          </button>
        </div>
      )}
    </div>
  );
};
