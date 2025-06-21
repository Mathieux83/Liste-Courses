import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'react-hot-toast'

// Export PDF
export const exporterPDF = (articles, nomListe = 'Ma Liste de Courses') => {
  try {
    const doc = new jsPDF()
    
    // Configuration
    const margeGauche = 20
    const margeHaut = 20
    let yPosition = margeHaut
    
    // Header
    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text(nomListe, margeGauche, yPosition)
    yPosition += 15
    
    // Date
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, margeGauche, yPosition)
    yPosition += 15
    
    // Ligne de séparation
    doc.setLineWidth(0.5)
    doc.line(margeGauche, yPosition, 190, yPosition)
    yPosition += 15
    
    // Articles
    doc.setFontSize(11)
    articles.forEach((article, index) => {
      // Vérifier si on a assez d'espace
      if (yPosition > 270) {
        doc.addPage()
        yPosition = margeHaut
      }
      
      const checkbox = article.checked ? '☑' : '☐'
      const nom = article.nom
      const prix = `${article.montant.toFixed(2)}€`
      
      // Checkbox et nom
      doc.text(`${checkbox} ${nom}`, margeGauche, yPosition)
      
      // Prix aligné à droite
      const prixWidth = doc.getTextWidth(prix)
      doc.text(prix, 190 - prixWidth, yPosition)
      
      yPosition += 8
    })
    
    // Total
    yPosition += 10
    doc.setLineWidth(0.5)
    doc.line(margeGauche, yPosition, 190, yPosition)
    yPosition += 10
    
    const total = articles.reduce((sum, article) => sum + article.montant, 0)
    const totalText = `Total approximatif: ${total.toFixed(2)}€`
    
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    const totalWidth = doc.getTextWidth(totalText)
    doc.text(totalText, 190 - totalWidth, yPosition)
    
    // Sauvegarde
    const fileName = `${nomListe.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
    
    toast.success('PDF généré avec succès !')
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    toast.error('Erreur lors de la génération du PDF')
  }
}

// Capture d'écran
export const capturerEcran = async (elementId, nomListe = 'liste') => {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error('Élément non trouvé')
    }
    
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      height: element.scrollHeight,
      width: element.scrollWidth
    })
    
    const link = document.createElement('a')
    link.download = `${nomListe.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.png`
    link.href = canvas.toDataURL('image/png')
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Capture d\'écran sauvegardée !')
  } catch (error) {
    console.error('Erreur lors de la capture:', error)
    toast.error('Erreur lors de la capture d\'écran')
  }
}

// Impression
export const imprimerListe = () => {
  try {
    window.print()
  } catch (error) {
    console.error('Erreur lors de l\'impression:', error)
    toast.error('Erreur lors de l\'impression')
  }
}
