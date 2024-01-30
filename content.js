// // Différentes petites fonctions ajoutées ou supprimées de Weda
// // Ne justifiant pas la création d'un fichier séparé

// // Fonction pour attendre la présence d'un élément avant de lancer une fonction
// // ! Très utilisé dans toute l'exension
function waitForElement(selector, text = null, timeout, callback) {
    var checkInterval = setInterval(function() {
        var elements = document.querySelectorAll(selector);
        for (var i = 0; i < elements.length; i++) {
            if (!text || elements[i].textContent.includes(text)) {
                callback(elements[i]);
                clearInterval(checkInterval);
                clearTimeout(timeoutId);
                return;
            }
        }
    }, 100);

    var timeoutId = setTimeout(function() {
        clearInterval(checkInterval);
        console.log(`Element ${selector} ${text ? 'with text "' + text + '"' : ''} not found after ${timeout} ms`);
    }, timeout);
}

// // Boutons du popup
// Celui pour renvoyer le dernier paiement TPE est dans fse.js
// Permet de mettre tout les éléments de la page en attente d'import sur "Consultation"
function allConsultation() {
    console.log('setAllImportToConsultation');
    var elements = document.querySelectorAll('[id^="ContentPlaceHolder1_FileStreamClassementsGrid_DropDownListGridFileStreamClassementEvenementType_"]');
    for (var i = 0; i < elements.length; i++) {
        // set the dropdown to "Consultation"
        elements[i].selectedIndex = 0;
        console.log('Element set to Consultation:', elements[i]);
    }
}

// // Gestion de l'affichage de l'aide
// afficher une infobulle à côté des entrées W avec la clé de submenuDict
function tooltipshower() {
    // vérifier que la fenêtre est active et que le focus est sur la page
    if (!document.hasFocus() || document.hidden) {
        return;
    }

    // first force the mouseover status to the element with class="level1 static" and aria-haspopup="ContentPlaceHolder1_MenuNavigate:submenu:2"
    var element = document.querySelector('[class="has-popup static"]');
    if (element) {
        element.dispatchEvent(new MouseEvent('mouseover', {
            view: window,
            bubbles: true,
            cancelable: true
        }));
    }
    // from keyCommands, extract for each key the action
    const entries = Object.entries(keyCommands);
    let submenuDict = {};

    for (const [key, value] of entries) {
        let action = value.action;
        // in the action extract the variable send to submenuW
        if (action.toString().includes('submenuW')) {
            var match = action.toString().match(/submenuW\('(.*)'\)/);
            if (match) {
                var submenu = match[1];
                submenuDict[submenu] = value.key;
            }
        }
    }

    console.log(submenuDict);

    // change the description of each class="level2 dynamic" whom description contain the key of submenuDict to add the corresponding value
    var elements = document.getElementsByClassName('level2 dynamic');
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var description = element.innerText;
        description = description.replace(/ \(\d+\)$/, '');
        // console.log('description', description);
        if (description in submenuDict) {
            // console.log('description in submenuDict', description);
            // add a tooltip with the key of submenuDict next to the element
            var tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.top = '0px';
            tooltip.style.left = '100%';
            tooltip.style.padding = '10px';
            tooltip.style.backgroundColor = '#284E98';
            tooltip.style.border = '1px solid black';
            tooltip.style.zIndex = '1000';
            // tooltip.style.color = 'black';
            tooltip.textContent = submenuDict[description];
            element.appendChild(tooltip);
        }
    }
}

// retirer l'infobulle d'aide et relacher W
function mouseoutW() {
    // Supprimer les tooltips
    var tooltips = document.querySelectorAll('div.tooltip');
    tooltips.forEach(function (tooltip) {
        tooltip.remove();
    });
    // relacher W
    var element = document.querySelector('[class="has-popup static"]');
    if (element) {
        element.dispatchEvent(new MouseEvent('mouseout', {
            view: window,
            bubbles: true,
            cancelable: true
        }));
    }

}



// // Aide au clic
// permet de cliquer sur un élément selon l'attribut onclick
function clickElementByOnclick(onclickValue) {
    var element = document.querySelector(`[onclick*="${onclickValue}"]`);
    console.log('Element:', element);
    if (element) {
        console.log('Clicking element onclickvalue', onclickValue);
        element.click();
        return true;
    } else {
        console.log('Element not found onclickvalue', onclickValue);
        return false;
    }
}


// Vérifie la présence de l'élément avec title="Prénom du patient"
function checkPatientName() {
    waitForElement('[title="Prénom du patient"]', null, 5000, function(patientNameElement) {
        var patientName = patientNameElement.value;
        waitForElement('vz-lecture-cv-widget', null, 5000, function(widgetElement) {
            var spans = widgetElement.getElementsByTagName('span');
            for (var i = 0; i < spans.length; i++) {
                if (spans[i].textContent.includes(patientName)) {
                    console.log('Patient name found');
                    spans[i].click();
                    return true;
                }
            }
            console.log('Patient name not found');
            return false;
        });
    });
}



// // Ecoutes d'évènements
// Vérifie que la fenêtre est active et que le focus est sur la page
window.addEventListener('blur', function () {
    console.log('Window lost focus (blur)');
    mouseoutW();
});
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Window lost focus (hidden)');
        mouseoutW();
    };
});


// Ecoute les instructions du script de fond au sujet de la popup
const actions = {
    'allConsultation': allConsultation,
    'tpebis': () => sendLastTPEamount()
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action in actions) {
        console.log(request.action + ' demandé');
        actions[request.action]();
    }
});

// Ecoute l'appuis de la touches Alt pour afficher l'aide
var tooltipTimeout;
document.addEventListener('keydown', function (event) {
    if (event.key === 'Alt') {
        tooltipTimeout = setTimeout(function () {
            tooltipshower();
        }, 500);
    }
});
document.addEventListener('keyup', function (event) {
    if (event.key === 'Alt') {
        clearTimeout(tooltipTimeout);
        mouseoutW();
    }
});


// // Change certains éléments selon l'URL les options
// [Page de Consultation] Modifie l'ordre de tabulation des valeurs de suivi
chrome.storage.local.get('TweakTabConsultation', function (result) {
    function changeTabOrder() {
        var elements = document.querySelectorAll('[id^="ContentPlaceHolder1_SuivisGrid_EditBoxGridSuiviReponse_"]');
        // change the taborder starting with 0 for elements[0] and incrementing by 1 for each element
        for (var i = 0; i < elements.length; i++) {
            elements[i].tabIndex = i + 1;
        }
    }
    if (result.TweakTabConsultation !== false) {
        if (window.location.href.startsWith('https://secure.weda.fr/FolderMedical/ConsultationForm.aspx')) {
            // Crée un nouvel observateur de mutations
            var observer = new MutationObserver(changeTabOrder);

            // Commence à observer le document avec les configurations spécifiées
            observer.observe(document, { childList: true, subtree: true });

            console.log('ConsultationFormTabOrderer started');
        }
    }
});

// [page de recettes] Appuie automatiquement sur le bouton "rechercher" après avoir sélectionné la page des recettes
// seulement si la page est https://secure.weda.fr/FolderGestion/RecetteForm.aspx, appuis sur id="ContentPlaceHolder1_ButtonFind"
chrome.storage.local.get('TweakRecetteForm', function (result) {
    let TweakRecetteForm = result.TweakRecetteForm;
    if (window.location.href === 'https://secure.weda.fr/FolderGestion/RecetteForm.aspx' && TweakRecetteForm !== false) {
        var button = document.getElementById('ContentPlaceHolder1_ButtonFind');
        if (button) {
            button.click();
            console.log('Button clicked on RecetteForm page');
        }
    }
});

// // [page d'accueil]
if (window.location.href.startsWith('https://secure.weda.fr/FolderMedical/PatientViewForm.aspx')) {
    // clique le premier patient disponible après un DOM change
    chrome.storage.local.get('autoSelectPatientCV', function (result) {
        let autoSelectPatientCV = result.autoSelectPatientCV;
        if (autoSelectPatientCV !== false) {
            // Cherche un patient seul dans le DOM
            let debounceTimer;

            function findPatient() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() {
                    waitForElement('[mattooltip="Dossier patient lié"]', null, 5000, function (element) {
                        var elements = document.querySelectorAll('[mattooltip="Dossier patient lié"]');
                        if (elements.length === 4) {
                            console.log('Patient seul trouvé, je clique dessus', elements[0]);
                            elements[0].click();
                            // remove element
                            elements[0].remove(); // évite un double clic sur l'élément
                        } else if (elements.length > 1) {
                            console.log(elements.length, 'trop de patients trouvé, je ne clique pas', elements);
                        } else {
                            console.log('Aucun patient trouvé', elements);
                        }
                    });
                }, 1000);
            }

            // Créer un observateur de mutations pour surveiller les modifications du DOM, puis déclenche findPatient
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    console.log('mutation DOM détectée');
                    observer.disconnect();
                    findPatient();
                    setTimeout(function () {
                        observer.observe(document, { childList: true, subtree: true });
                    }, 1000);
                });
            });

            // Configurer l'observateur pour surveiller tout le document
            var config = { childList: true, subtree: true };
            observer.observe(document, config);
        }
    });


    // copie automatiquement dans le presse papier le NIR du patient quand on clique dessus:
    chrome.storage.local.get('TweakNIR', function (result) {
        let TweakNIR = result.TweakNIR;
        if (TweakNIR !== false) {
            function addCopySymbol(element, copyText) {
                // Define the id for the copySymbol
                var copySymbolId = 'copySymbol-' + element.id;

                // Check if an element with the same id already exists
                if (!document.getElementById(copySymbolId)) {
                    // Create a new element for the copy symbol
                    var copySymbol = document.createElement('span');
                    copySymbol.textContent = '📋'; // Use clipboard emoji as copy symbol
                    copySymbol.style.cursor = 'pointer'; // Change cursor to pointer when hovering over the copy symbol
                    copySymbol.title = 'Cliquez ici pour copier le NIR dans le presse-papiers'; // Add tooltip text
                    copySymbol.id = copySymbolId;

                    // Add a click event handler to the copy symbol
                    copySymbol.addEventListener('click', function () {
                        console.log(copyText);
                        navigator.clipboard.writeText(copyText);
                    });

                    // Add the copy symbol next to the element
                    element.parentNode.insertBefore(copySymbol, element.nextSibling);
                }
            }

            function watchForElements() {
                waitForElement('span.label', 'NIR', 5000, function (element) {
                    var nir = element.textContent.match(/(\d{13} \d{2})/)[1];
                    nir = nir.replace(/\s/g, ''); // Supprime tous les espaces de la chaîne
                    addCopySymbol(element, nir);
                    element.addEventListener('click', function () {
                        console.log('nir', nir);
                        navigator.clipboard.writeText(nir);
                    });
                });
                waitForElement('#ContentPlaceHolder1_EtatCivilUCForm1_LabelPatientSecuriteSocial', '', 5000, function (element) {
                    var secu = element.textContent.match(/(\d{1} \d{2} \d{2} \d{2} \d{3} \d{3} \d{2})/)[1];
                    secu = secu.replace(/\s/g, ''); // Supprime tous les espaces de la chaîne
                    addCopySymbol(element, secu);
                    element.addEventListener('click', function () {
                        console.log('secu', secu);
                        navigator.clipboard.writeText(secu);
                    });
                });
            }
            
            watchForElements();

            // Créer un observateur de mutations pour surveiller les modifications du DOM
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    console.log('mutation DOM détectée');
                    observer.disconnect();
                    watchForElements();
                    setTimeout(function () {
                        observer.observe(document, { childList: true, subtree: true });
                    }, 1000);
                });
            });

            // Configurer l'observateur pour surveiller tout le document
            var config = { childList: true, subtree: true };
            observer.observe(document, config);
        }
    });
}

// [page de gestion des feuilles de soins]
if (window.location.href === 'https://secure.weda.fr/vitalzen/gestion.aspx') {
    chrome.storage.local.get('TweakFSEGestion', function (result) {
        let TweakFSEGestion = result.TweakFSEGestion;
        if (TweakFSEGestion !== false) {
            waitForElement('.mat-icon.notranslate.material-icons.mat-icon-no-color', 'search', 5000, function (element) {
                console.log('element', element, 'trouvé, je clique dessus');
                element.click();
            });
        }
    });
}



// // Retrait des suggestions de titre
chrome.storage.local.get('RemoveTitleSuggestions', function (result) {
    function RemoveTitleSuggestions() {
        console.log('RemoveTitleSuggestions started');
        var elements = document.getElementById('DivGlossaireReponse');
        if (elements) {
            elements.remove();
        }
    }
    if (result.RemoveTitleSuggestions !== false) {
        // vérifie que l'on est sur une page soufrant du problème
        if (window.location.href.startsWith('https://secure.weda.fr/FolderMedical/')
            && window.location.href.includes('Form.aspx')
            && !window.location.href.startsWith('https://secure.weda.fr/FolderMedical/PatientViewForm.aspx')
            && !window.location.href.startsWith('https://secure.weda.fr/FolderMedical/UpLoaderForm.aspx')) {

            // Créer un observateur de mutations pour surveiller les modifications du DOM
            var titleremoverTimeout;
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (titleremoverTimeout) {
                        clearTimeout(titleremoverTimeout);
                    }
                    titleremoverTimeout = setTimeout(RemoveTitleSuggestions, 400);
                });
            });

            // Configurer l'observateur pour surveiller tout le document
            var config = { childList: true, subtree: true };
            observer.observe(document, config);

            RemoveTitleSuggestions();
        }
    }
});



// // Ajoute l'écoute du clavier pour faciliter les prescription
chrome.storage.local.get(['KeyPadPrescription'], function(result) {
    if (result.KeyPadPrescription !== false) {
        if (window.location.href.startsWith('https://secure.weda.fr/FolderMedical/PrescriptionForm.aspx')) {
            console.log('numpader started');
            var index = {
                '0': 'SetQuantite(0);',
                '1': 'SetQuantite(1);',
                '2': 'SetQuantite(2);',
                '3': 'SetQuantite(3);',
                '4': 'SetQuantite(4);',
                '5': 'SetQuantite(5);',
                '6': 'SetQuantite(6);',
                '7': 'SetQuantite(7);',
                '8': 'SetQuantite(8);',
                '9': 'SetQuantite(9);',
                '/': 'SetQuantite(\'/\');',
                '.': 'SetQuantite(\',\');',
                ',' : 'SetQuantite(\',\');',
                'Backspace': 'AnnulerQuantite();',
                'à': 'SetQuantite(\' à \');',
            };

            document.addEventListener('keydown', function (event) {
                console.log('event.key', event.key);
                if (event.key in index) {
                    console.log('key pressed:', event.key);
                    clickElementByOnclick(index[event.key]);
                }
            });
        }
    }
});